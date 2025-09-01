import { useEffect, useState } from 'react'

export function usePesoBalanca() {
  // Get URL from environment variable or use default, with StackBlitz detection
  const isStackBlitz = window.location.hostname.includes('stackblitz') || 
                       window.location.hostname.includes('staticblitz');
  const scaleUrl = isStackBlitz 
    ? null // Don't even try to connect in StackBlitz
    : (import.meta.env.VITE_BALANCA_URL || 'http://localhost:4000/peso');
  
  // Check if we're in development mode or if the scale service is likely unavailable
  const isDevMode = process.env.NODE_ENV === 'development' || 
                   window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   isStackBlitz;
  
  const [peso, setPeso] = useState<string>("0.000");
  const [conectado, setConectado] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    // Skip all requests if we're in development mode or if polling is paused
    if (isDevMode || paused || !scaleUrl) {
      // Return early with default values
      setConectado(false);
      return;
    }
    
    const intervalo = window.setInterval(() => {
      // Use AbortController to timeout the request
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 1000); // 1000ms timeout
      
      try {
        if (!scaleUrl) {
          // Skip fetch if URL is null (StackBlitz environment)
          setPeso("0.000");
          setConectado(false);
          return;
        }
        
        fetch(scaleUrl, { 
          signal: controller.signal,
          // Add cache busting to prevent cached responses
          headers: { 'Cache-Control': 'no-cache' }
        })
          .then(res => res.json())
          .then(data => {
            if (data?.peso) {
              setPeso(data.peso);
              setConectado(true);
              setErrorCount(0); // Reset error count on success
            } else {
              setPeso("0.000");
              setConectado(false);
              incrementErrorCount();
            }
          })
          .catch((error) => {
            // Don't log the error to avoid console flooding
            setPeso("0.000");
            setConectado(false);
            incrementErrorCount();
            
            // Clear the timeout to prevent memory leaks
            clearTimeout(timeoutId);
          });
      } catch (error) {
        // Catch any synchronous errors
        setPeso("0.000");
        setConectado(false);
        incrementErrorCount();
      }
        
      return () => {
        clearTimeout(timeoutId);
        controller.abort();
      };
    }, 2000); // Increased to 2 seconds to reduce request frequency

    // Function to increment error count and pause if needed
    const incrementErrorCount = () => {
      setErrorCount(prev => {
        const newCount = prev + 1;
        if (newCount > 5) {
          console.log('⚠️ Too many scale connection errors, pausing requests');
          setPaused(true);
          
          // Resume after 30 seconds
          window.setTimeout(() => {
            console.log('🔄 Resuming scale connection attempts');
            setPaused(false);
            setErrorCount(0);
          }, 30000);
        }
        return newCount;
      });
    };

    return () => clearInterval(intervalo);
  }, [paused]);

  return {
    // Ensure peso is always a number
    peso: parseFloat(peso.replace(',', '.') || "0.000"),
    conectado: isDevMode ? false : conectado,
    pesoFormatado: `${peso.replace(',', '.')} Kg`,
    isDevMode, // Export this flag so components can show appropriate messages
    scaleUrl, // Export the URL for debugging purposes
    isStackBlitz // Export this flag for specific StackBlitz messaging
  }
}