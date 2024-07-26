#Add the following script to your javascript code

```
<script>
document.addEventListener('DOMContentLoaded', function() {
    var script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/gh/xAlpha8/realtime-examples@main/chat_embed/WidgetIframe.js#L1-L138";
    script.onload = function() {
    runAdapt();
    };
    document.body.appendChild(script);
    });
</script>
```
