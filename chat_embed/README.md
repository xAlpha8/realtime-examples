#Add the following script to your javascript code

```
<script>
document.addEventListener('DOMContentLoaded', function() {
    var script = document.createElement('script');
    script.src = "https://gist.githubusercontent.com/altairmn/1b1ec8f1870dd7c65ef1ae5e71e48892/raw/d512cd7fec2cfe97f5b5ab27825419be4c90f284/script.js";
    script.onload = function() {
    runAdapt();
    };
    document.body.appendChild(script);
    });
</script>
```
