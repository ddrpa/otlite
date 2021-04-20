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

翻译进度保存在浏览器的 localStorge 中，所以你可以理解为这是一个单存档槽位的工具。也可以设置定期自动保存。

“导出到剪贴板”将把预览窗口中的内容复制到剪贴板，可能需要在浏览器端赋予剪贴板访问权限。

要开始翻译一篇新的文章，请点击“清空所有内容”。

什么，你问我文章长了怎么办？用 [OmegaT](https://omegat.org/) 啊 🐶 。
