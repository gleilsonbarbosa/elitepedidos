@@ .. @@
   const playMessageSound = () => {
     try {
       // Obter configuração de som do localStorage
       const soundSettings = localStorage.getItem('chatSoundSettings');
       const settings = soundSettings ? JSON.parse(soundSettings) : { enabled: true, volume: 0.5, soundUrl: "https://assets.mixkit.co/active_storage/sfx/1862/1862-preview.mp3" };
       
       // Verificar se o som está habilitado
       if (!settings.enabled) {
         console.log('🔕 Som de mensagem desabilitado nas configurações');
         return;
       }
       
       // Criar um elemento de áudio e tocar o som configurado
       const audio = new Audio(settings.soundUrl);
       audio.volume = settings.volume; // Ajustar volume conforme configuração
       audio.play().catch(e => {
         console.error('Erro ao tocar som de mensagem:', e);
         // Tentar método alternativo se falhar
         playMessageSoundFallback();
       });
     } catch (error) {
       console.error('Erro ao tocar som de mensagem:', error);
       // Tentar método alternativo se falhar
       playMessageSoundFallback();
     }
   };
   
   // Função de fallback para tocar som usando Web Audio API
   const playMessageSoundFallback = () => {
     try {
       const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
       const oscillator = audioContext.createOscillator();
       const gainNode = audioContext.createGain();
       
       oscillator.connect(gainNode);
       gainNode.connect(audioContext.destination);
       
       oscillator.frequency.value = 600;
       oscillator.type = 'sine';
       
       gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
       gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
       
       oscillator.start(audioContext.currentTime);
       oscillator.stop(audioContext.currentTime + 0.3);
     } catch (error) {
       console.error('Erro ao tocar som de fallback:', error);
     }
   };