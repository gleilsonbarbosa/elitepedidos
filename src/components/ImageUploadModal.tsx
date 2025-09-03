@@ .. @@
   const handleExport = () => {
     const data = JSON.stringify(unknownQueries, null, 2);
     const blob = new Blob([data], { type: 'application/json' });
     const url = URL.createObjectURL(blob);
     
     const a = document.createElement('a');
     a.href = url;
     a.download = `unknown_queries_${new Date().toISOString().split('T')[0]}.json`;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
-    URL.revokeObjectURL(url);
+    window.setTimeout(() => URL.revokeObjectURL(url), 100);
   };