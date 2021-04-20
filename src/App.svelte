<script>
  import { onMount, onDestroy } from "svelte";
  import tokenizer from "sbd";

  const VERSION = 1;
  const AUTOSAVE_TIME_INTERVAL = 8000;
  // 分片状态
  const SEGMENT_STATUS = {
    INITIALIZED: 0,
    // MACHINETRANSLATED: 1,
    MODIFIED: 2,
  };

  const REGEX_PREFIX_NEWLINE = /^[\r\n\t\s]*/g;
  const REGEX_SUFFIX_NEWLINE = /[\r\n\t\s]*$/g;

  let sourceText = "";
  let segments = [];
  let autoSaveTimerID;
  let translatorSupported = false;

  // 段落分片
  function _sentences(source) {
    return tokenizer
      .sentences(source, {
        //   newline_boundaries: true,
        //   preserve_whitespace: true,
      })
      .map((sentence) => {
        const prefix = sentence.match(REGEX_PREFIX_NEWLINE)[0] ?? "";
        const suffix = sentence.match(REGEX_SUFFIX_NEWLINE)[0] ?? "";
        sentence = sentence.trim();
        if (sentence.lastIndexOf("\n") > -1) {
          // 有时候 sbd 不会拆分如下段落
          // https://boilingsteam.com/sid-meier-more-than-just-civilization/
          // SID MEIER: MORE THAN JUST CIVILIZATION
          // BY EKIANJO APRIL 16, 2021  LEAVE A COMMENT
          //
          // Let’s face it.
          // 通过换行符强制拆分
          let array = sentence
            .split("\n")
            .map((part) => part.trim())
            .filter((part) => part.length > 0)
            .map((part) => ({ prefix: "", suffix: "\n", source: part }));
          array[0].prefix = prefix;
          array[array.length - 1].suffix = suffix;
          return array;
        } else {
          return [
            {
              prefix,
              suffix,
              source: sentence,
            },
          ];
        }
      })
      .flat()
      .map((segment, index) => ({
        ...segment,
        target: segment.source,
        id: index + 1,
        status: SEGMENT_STATUS.INITIALIZED,
      }));
  }
  // 翻译结果预览
  $: preview = segments.reduce((acc, val) => {
    return acc + val.prefix + val.target.trim() + val.suffix;
  }, "");

  onMount(async () => {
    _loadSave();
    // 定时存档
    autoSaveTimerID = setInterval(() => _saveSegments(segments, VERSION), AUTOSAVE_TIME_INTERVAL);
    // try access translatorHelper
    translatorSupported = undefined !== window.translatorHelper;
    if (translatorSupported) {
      console.info(`window.translatorHelper.version: ${window.translatorHelper.version}`);
    }
  });

  onDestroy(async () => {
    if (undefined !== autoSaveTimerID) {
      clearInterval(autoSaveTimerID);
    }
  });

  function _loadSave() {
    let _version = parseInt(localStorage.getItem("version"));
    if (isNaN(_version)) {
      _version = VERSION;
    }
    if (_version > VERSION) {
      alert("存档版本高于当前软件版本");
      // TODO 如何处理？
      // hold here
      while (1) {
        debugger;
      }
    } else if (_version === VERSION) {
      let _segments = [];
      try {
        _segments = JSON.parse(localStorage.getItem("segments")) ?? [];
        // TODO 检查存档格式
      } catch (e) {}
      segments = _segments;
      _saveSegments(_segments, VERSION);
      return;
    } else {
      // _version < VERSION
      // 存档转换
      _saveConvertor.get(_version)();
      localStorage.setItem("version", _version + 1);
      return _loadSave();
    }
  }

  function _saveSegments(_segments, _version) {
    localStorage.setItem("segments", JSON.stringify(_segments));
    localStorage.setItem("version", _version);
  }

  // 存档转换，把当前版本存档转换到下一个版本的存档格式
  const _saveConvertor = new Map([
    [
      // version 1 -> version 2
      // example
      1,
      () => {
        let save = JSON.parse(localStorage.getItem("segments"));
        // do something
        localStorage.setItem("segments", JSON.stringify(save));
        return;
      },
    ],
  ]);

  function handleShortcut(event) {
    // https://omegat.sourceforge.io/manual-latest/zh_CN/chapter.menu.html
    if (event.ctrlKey) {
      const currentSegmentId = parseInt(event.target.dataset.segmentId);
      if (event.key === "Enter" || event.key === "p") {
        _jumpToSegment(_getPreviousSegmentId(currentSegmentId));
      } else if (event.key === "n") {
        _jumpToSegment(_getNextSegmentId(currentSegmentId));
      } else if (event.key === "u") {
        _jumpToSegment(_getNextUntranslatedSegmentId(currentSegmentId));
      } else if (event.key === "r") {
        segments = segments.map((segment) => {
          if (segment.id === currentSegmentId) {
            return {
              ...segment,
              target: segment.source,
            };
          } else {
            return segment;
          }
        });
      } else if (event.key === "m" && translatorSupported) {
        const segmentIndex = segments.findIndex((segment) => segment.id === currentSegmentId);
        const currentSegment = segments[segmentIndex];
        window.translatorHelper
          .insertTask(currentSegment.source)
          .then((tgt) => {
            segments = [
              ...segments.slice(0, segmentIndex),
              { ...currentSegment, target: tgt },
              ...segments.slice(segmentIndex + 1),
            ];
          })
          .catch(console.error);
      }
    } else if (event.key === "Enter") {
      const currentSegmentId = parseInt(event.target.dataset.segmentId);
      _jumpToSegment(_getNextSegmentId(currentSegmentId));
    }
    return false;
  }

  function handleSourceTextSet() {
    segments = _sentences(sourceText);
    _saveSegments(segments, VERSION);
  }

  // 自动保存开关
  function handleAutoSaveToggle(event) {
    const enableAutoSave = event.target.value;
    if (enableAutoSave) {
      if (undefined === autoSaveTimerID) {
        autoSaveTimerID = setInterval(() => _saveSegments(segments, VERSION), AUTOSAVE_TIME_INTERVAL);
      }
      _saveSegments(segments, VERSION);
    } else {
      if (undefined !== autoSaveTimerID) {
        clearInterval(autoSaveTimerID);
      }
    }
  }

  // 存档
  function handleSave() {
    _saveSegments(segments, VERSION);
  }

  // 复制结果到剪贴板
  function handleExportToClipBoard() {
    navigator.clipboard
      .writeText(preview)
      .then(() => {})
      .catch(console.error);
  }

  // 清除存档
  function handleClearAll() {
    segments = [];
    localStorage.removeItem("segments");
    localStorage.removeItem("version");
  }

  function _getNextSegmentId(currentSegmentId) {
    if (currentSegmentId < segments.length) {
      return currentSegmentId + 1;
    } else {
      return currentSegmentId;
    }
  }

  function _getNextUntranslatedSegmentId(currentSegmentId) {
    return (
      segments
        .filter((segment) => segment.status !== SEGMENT_STATUS.MODIFIED)
        .map((segment) => segment.id)
        .find((id) => id > currentSegmentId) ?? currentSegmentId
    );
  }

  function _getPreviousSegmentId(currentSegmentId) {
    if (currentSegmentId > 1) {
      return currentSegmentId - 1;
    } else {
      return currentSegmentId;
    }
  }

  function _jumpToSegment(segmentId) {
    const nextSegment = document.querySelector(`.line-editor[data-segment-id="${segmentId}"]`);
    if (null !== nextSegment) {
      nextSegment.focus();
      nextSegment.setSelectionRange(0, -1);
    }
  }
</script>

<main>
  {#if segments.length < 1}
    <button on:click={handleSourceTextSet}>confirm</button>
    <a href="https://github.com/ddrpa/otlite" target="_blank">帮助</a>
    <textarea class="source-textarea" placeholder="在此处粘贴要翻译的文本" bind:value={sourceText} />
  {:else}
    <div class="tools">
      <button on:click={handleSave}>立即保存</button>
      <label for="autosave">
        <input type="checkbox" name="autosave" on:change={handleAutoSaveToggle} />
        自动保存（每{AUTOSAVE_TIME_INTERVAL / 1000}秒保存一次）
      </label>
      <label for="translator">
        <input type="checkbox" name="translator" disabled />
        启用自动翻译（开发中）
      </label>
      <a disabled href="https://github.com/ddrpa/otlite" target="_blank">如何配置翻译服务</a>
      <button on:click={handleExportToClipBoard}>导出到剪贴板</button>
      <a href="https://github.com/ddrpa/otlite" target="_blank">帮助</a>
      <button on:click={handleClearAll}>清空所有内容</button>
    </div>
    <div class="pane-container">
      <div class="pane-left">
        <div class="resize-bar" />
        <div class="resize-line" />
        <div class="pane-left-actual">
          {#each segments as { source, target, id, status }, index}
            <p>
              {source}
              <span
                class="segment-tag
				 {SEGMENT_STATUS.INITIALIZED === status
                  ? 'initialized'
                  : ''}
				 {SEGMENT_STATUS.MODIFIED === status ? 'modified' : ''}"
              >
                {`<#Segment${id}>`}
              </span>
            </p>
            <textarea
              data-segment-id={id}
              class="line-editor"
              bind:value={target}
              on:keyup={handleShortcut}
              on:blur={() => (status = SEGMENT_STATUS.MODIFIED)}
            />
            <button
              on:click={() => {
                target = source;
                status = SEGMENT_STATUS.INITIALIZED;
              }}
            >
              revert
            </button>
          {/each}
        </div>
      </div>
      <div class="pane-right">
        <textarea disabled class="preview-textarea">{preview}</textarea>
      </div>
    </div>
  {/if}
</main>

<style>
  textarea {
    width: 100%;
  }
  textarea.source-textarea {
    height: 90vh;
  }
  textarea.preview-textarea {
    height: 100%;
  }
  .line-editor {
    min-width: 80%;
    word-break: break-word;
  }
  .segment-tag.initialized {
    color: red;
  }
  .segment-tag.modified {
    color: green;
  }

  .tools,
  .tools label {
    display: inline;
  }

  /* https://www.zhangxinxu.com/study/201903/css-idea/behavior-stretch.php */
  .pane-container {
    overflow: hidden;
    height: 90vh;
  }
  .pane-left {
    position: relative;
    float: left;
    height: 90vh;
  }
  .pane-right {
    box-sizing: border-box;
    overflow: hidden;
    height: 90vh;
    padding-left: 16px;
  }
  .pane-left-actual {
    position: absolute;
    top: 0;
    right: 5px;
    bottom: 0;
    left: 0;
    padding: 16px;
    overflow-x: hidden;
  }
  .resize-bar {
    width: 70vw;
    height: inherit;
    resize: horizontal;
    cursor: ew-resize;
    cursor: col-resize;
    opacity: 0;
    overflow: scroll;
  }
  /* 拖拽线 */
  .resize-line {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    border-right: 2px solid #eee;
    border-left: 1px solid #bbb;
    pointer-events: none;
  }
  .resize-bar:hover ~ .resize-line,
  .resize-bar:active ~ .resize-line {
    border-left: 1px dashed skyblue;
  }
  .resize-bar::-webkit-scrollbar {
    width: 200px;
    height: inherit;
  }
</style>
