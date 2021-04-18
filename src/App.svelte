<script>
  import tokenizer from "sbd";

  // 分片状态
  const SEGMENT_STATUS = {
    INITIALIZED: 0,
    // MACHINETRANSLATED: 1,
    MODIFIED: 2,
  };

  const REGEX_PREFIX_NEWLINE = /^[\r\n\t\s]*/g;
  const REGEX_SUFFIX_NEWLINE = /[\r\n\t\s]*$/g;

  let sourceText = "";

  // 段落分片
  $: segments = tokenizer
    .sentences(sourceText, {
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
  // 翻译结果预览
  $: preview = segments.reduce((acc, val) => {
    console.log(val);
    return acc + val.prefix + val.target.trim() + val.suffix;
  }, "");

  function handleShortcut(event) {
    if (event.ctrlKey) {
      const currentSegmentId = parseInt(event.target.dataset.segmentId);
      if (event.key === "Enter" || event.key === "p") {
        _jumpToSegment(_getPreviousSegmentId(currentSegmentId));
      } else if (event.key === "n") {
        _jumpToSegment(_getNextSegmentId(currentSegmentId));
      } else if (event.key === "u") {
        _jumpToSegment(_getNextUntranslatedSegmentId(currentSegmentId));
      }
    } else if (event.key === "Enter") {
      const currentSegmentId = parseInt(event.target.dataset.segmentId);
      _jumpToSegment(_getNextSegmentId(currentSegmentId));
    }
    return false;
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
  {#if sourceText.length < 1}
    <textarea class="source-textarea" bind:value={sourceText} placeholder="在此处粘贴要翻译的文本" />
  {:else}
    <div class="pane-container">
      <div class="pane-left">
        <div class="resize-bar" />
        <div class="resize-line" />
        <div class="pane-left-actual">
          {#each segments as { source, target, id, status, prefix, suffix }, index}
            <p>
              {source}
              <span
                class="segment-tag
				 {SEGMENT_STATUS.INITIALIZED === status
                  ? 'initialized'
                  : ''}
				 {SEGMENT_STATUS.MODIFIED === status ? 'modified' : ''}">{`<#Segment${id}>`}</span
              >
            </p>
            <textarea
              data-segment-id={id}
              class="line-editor"
              bind:value={target}
              on:keyup={handleShortcut}
              on:blur={() => (status = SEGMENT_STATUS.MODIFIED)}
            />
            <!-- <p><span
              data-segment-id={id}
              class="line-editor textarea"
              on:keyup={handleShortcut}
              on:blur={() => (status = SEGMENT_STATUS.MODIFIED)}
              role="textbox"
			  bind:innerHTML={target}
              contenteditable></span
            ></p> -->
            <button
              on:click={() => {
                target = source;
                status = SEGMENT_STATUS.INITIALIZED;
              }}>revert</button
            >
          {/each}
        </div>
      </div>
      <div class="pane-right">
        <textarea class="preview-textarea">{preview}</textarea>
      </div>
    </div>
  {/if}
</main>

<style>
  textarea {
    width: 100%;
  }
  textarea.source-textarea {
    height: 100vh;
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

  /* main {
    padding: 1em;
    margin: 0 auto;
  } */
  .pane-container {
    overflow: hidden;
  }
  .pane-left {
    position: relative;
    float: left;
    height: 100vh;
  }
  .pane-right {
    box-sizing: border-box;
    overflow: hidden;
    height: 100vh;
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
