# otlite

一个辅助翻译 2000-5000 字符英语文章的小工具

[demo](https://ddrpa.github.io/otlite)

我的语文水平也不怎么样，做个截图仅供 demo 参考，希望诸君不要对内容作过多评价 🐶 。

![Screenshot 1](/docs/Screenshot_2.png)

演示所用文章为 [MORROWIND REBOOTED THE ORIGINAL XBOX WITHOUT YOU EVER NOTICING - by: Lewin Day](https://hackaday.com/2021/04/14/morrowind-rebooted-the-original-xbox-without-you-ever-noticing/)。

## 使用说明

从剪贴板导入原文，用 [sbd](https://github.com/Tessmore/sbd) 拆分成句子，逐句（人工）翻译后合并成译文。

一些快捷键：

- Ctrl+U 移动到下一个未修改过的片段
- Ctrl+N 或 Enter 移动到下一个片段
- Ctrl+P 或 Ctrl+Enter 移动到上一个片段
- Ctrl+R 用原文重置当前片段（同 revert 按钮）
- Ctrl+M 调用服务翻译当前行（详见如何配置翻译服务）

翻译进度保存在浏览器的 localStorge 中，所以你可以理解为这是一个单存档槽位的工具。也可以设置定期自动保存。

“导出到剪贴板”将把预览窗口中的内容复制到剪贴板，可能需要在浏览器端赋予剪贴板访问权限。

要开始翻译一篇新的文章，请点击“清空所有内容”。

什么，你问我文章长了怎么办？用 [OmegaT](https://omegat.org/) 啊 🐶 。

## 如何配置翻译服务

目前仅支持通过 Ctrl+M 对当前行手动调用翻译服务，通过队列支持批量翻译的功能仍在开发中。

要支持此功能，需要在浏览器中安装油猴脚本等用户脚本管理工具，并根据需要添加 `/scripts/userscripts` 中的脚本。以目前支持的[小牛翻译](https://niutrans.com/Price)脚本为例，从用户中心获取 API 的 access token 并添加到脚本的 `const _ACCESS_TOKEN = ""`; 行中。其他收费服务提供商对应的用户脚本可能会按需求开发（因为要花钱 🐶）。

首次运行此功能可能会弹出权限确认窗口，选择 “always allow” 即可。该功能处于概念验证阶段，设计的接口可能会发生变化，且不会通知用户。
