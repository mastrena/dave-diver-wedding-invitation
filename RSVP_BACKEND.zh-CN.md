# 如何接入真实的后台宾客管理（第三方表单路线）

> 适用人群：想让宾客登记「真正收集到名单」、能在后台看到谁参加（含住宿需求）并导出 Excel 的新人。
> 路线：用第三方表单平台（腾讯问卷 / 金数据）做一个宾客登记表，把请柬的登记区替换成第三方表单入口。**零代码搭后台**，新人在表单平台后台查看和导出数据。

## 一、先说清楚现状

本项目的宾客登记**默认是演示模式**：宾客填写的内容只保存在他自己手机的浏览器里（localStorage），不会上传到任何服务器，新人在后台看不到名单。

这是有意为之的安全默认——不接任何后端，就没有隐私泄露风险，也不产生服务器费用。

**如果你需要真正收集名单**（比如需要统计住宿人数、安排接送），请按本教程接入第三方表单。整个过程：

1. 在表单平台建一张「宾客登记表」（约 5 分钟）
2. 拿到表单链接
3. 把请柬登记区替换成表单入口（复制粘贴一段代码）
4. 在表单平台后台实时查看名单、导出 Excel

## 二、推荐平台对比

| 平台 | 网址 | 费用 | 后台能力 | 适合 |
|---|---|---|---|---|
| 腾讯问卷 | wj.qq.com | 免费（单表最多 10 万条） | 实时统计、导出 Excel/CSV、微信生态流畅 | ⭐ 首选，微信好友填写体验最好 |
| 金数据 | jinshuju.net | 免费版够用 | 实时查看、导出 Excel/CSV、可嵌入 | 需要嵌入页面内时 |
| WPS 表单 | kdocs.cn | 免费 | 实时查看、导出 | 已用 WPS 办公的用户 |

## 三、操作步骤（以腾讯问卷为例）

### 第 1 步：建宾客登记表

1. 打开 https://wj.qq.com ，用微信扫码登录
2. 点「创建问卷」→ 选「报名/登记」类型或「空白问卷」
3. 添加题目，建议与请柬登记区字段保持一致：

   | 请柬登记字段 | 问卷题型 |
   |---|---|
   | 宾客姓名 | 单行填空（设为必答） |
   | 出席人数 | 下拉选择 1~6 人（必答） |
   | 是否需要住宿 | 单选：需要 / 不需要（必答） |
   | 入住时间 | 日期时间选择（选「需要住宿」时必答） |
   | 退房时间 | 日期时间选择（选「需要住宿」时必答） |
   | 联系电话 | 单行填空（非必答，方便新人联系） |
   | 发送给新人的留言 | 多行填空（非必答） |

4. 点「发布」，复制生成的问卷链接（形如 `https://wj.qq.com/s2/xxxx/xxxx`）

### 第 2 步：把请柬登记区替换成表单入口

打开 `index.html`，找到登记区（`<section class="rsvp-section" id="rsvp">` 整块），**把整个 `<form id="rsvp-form">...</form>` 和 `<div class="rsvp-success">...</div>` 替换成下面的代码**：

```html
<div class="rsvp-phone reveal">
  <div class="app-bar"><span>◉</span><b>WEDDING MISSION</b><small>GUEST FORM</small></div>
  <div class="demo-notice" style="padding: 18px 16px; text-align: center;">
    <p style="font-size: 14px; font-weight: 900; margin: 0 0 6px;">📋 宾客登记</p>
    <p style="font-size: 11px; line-height: 1.8; margin: 0 0 14px; color: #c7fbff;">
      请点击下方按钮，在登记表中填写信息。<br />名单会汇总到新人后台。
    </p>
    <a class="submit-button" style="display: inline-block; text-decoration: none; padding: 13px 20px; border: 3px solid #775014; color: #123253; background: #ffd638; box-shadow: 5px 6px #00335c; font-size: 13px; font-weight: 900;"
       href="https://wj.qq.com/s2/xxxx/xxxx" target="_blank" rel="noopener">
      <span>前往填写宾客登记表</span><b> ▶</b>
    </a>
  </div>
</div>
```

> 把 `href="https://wj.qq.com/s2/xxxx/xxxx"` 换成你第 1 步拿到的问卷链接。
> `target="_blank"` 会在新窗口打开问卷；如果你希望在当前页面跳转，把 `target="_blank" rel="noopener"` 删掉即可。

### 第 3 步：后台查看名单、导出 Excel

1. 登录腾讯问卷后台 → 打开你的问卷
2. 「数据统计」页实时显示回收数量和每条填写明细
3. 点「导出数据」→ 选择 Excel / CSV 格式下载
4. 可在后台按「是否需要住宿 = 需要」筛选，直接得到需安排住宿的宾客名单

## 四、可选：把表单直接嵌入页面（不跳转）

如果你希望宾客**不离开请柬页面**直接填写，用 iframe 嵌入：

```html
<div class="rsvp-phone reveal">
  <div class="app-bar"><span>◉</span><b>WEDDING MISSION</b><small>GUEST FORM</small></div>
  <iframe src="https://wj.qq.com/s2/xxxx/xxxx" style="width: 100%; height: 620px; border: 0; background: #fff;"></iframe>
</div>
```

注意事项：
- iframe 高度写死 620px，字段多就调大
- 腾讯问卷/金数据的嵌入页面在微信内置浏览器中可用；个别平台若提示「不允许嵌入」，就用第 3 步的跳转按钮方案
- 金数据的嵌入方式：表单后台 →「发布」→「更多发布方式」→ 复制 iframe 或 script 嵌入代码（开启「微信收集信息」会导致嵌入失效，注意关闭）

## 五、隐私合规提醒（重要）

一旦接入第三方表单，姓名、电话、留言等将**真实上传到表单平台**：

1. 表单页应注明用途，例如「本表仅用于统计出席人数与住宿安排，信息仅婚礼筹备期使用」
2. 不要收集与婚礼无关的敏感信息（身份证号等）
3. 婚礼结束后，在表单后台导出名单并删除/关闭表单
4. 如果表单平台需要实名/付费开通数据导出权限，以平台最新说明为准

## 六、验证清单

- [ ] 手机打开请柬，登记区显示「前往填写宾客登记表」按钮（或内嵌表单）
- [ ] 点击后能正常打开表单，所有字段可填写、必答项校验正常
- [ ] 提交后，表单平台后台能看到这条记录
- [ ] 导出 Excel 能正常下载并打开
- [ ] 微信里发给朋友测试一遍（微信内置浏览器行为与普通浏览器略有差异）
