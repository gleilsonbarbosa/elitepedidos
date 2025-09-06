import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface OrderSettings {
  // Sound Notifications
  sound_enabled: boolean;
  sound_type: 'classic' | 'bell' | 'chime' | 'alert';
  sound_volume: number;
  auto_repeat: boolean;
  repeat_interval: number; // seconds
  channel_sounds: {
    delivery: string;
    attendance: string;
    pdv: string;
  };
  
  // Visual Alerts
  popup_enabled: boolean;
  badge_animation: 'blink' | 'vibrate' | 'scale' | 'none';
  status_colors: {
    new: string;
    preparing: string;
    ready: string;
    delivered: string;
  };
  
  // Workflow
  auto_accept: boolean;
  default_prep_time: number;
  auto_print: boolean;
  selected_printer: string;
}

export const useOrderSettings = () => {
  const [settings, setSettings] = useState<OrderSettings>({
    sound_enabled: true,
    sound_type: 'classic',
    sound_volume: 70,
    auto_repeat: false,
    repeat_interval: 30,
    channel_sounds: {
      delivery: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
      attendance: 'https://assets.mixkit.co/active_storage/sfx/1862/1862-preview.mp3',
      pdv: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
    },
    popup_enabled: true,
    badge_animation: 'blink',
    status_colors: {
      new: '#ef4444',
      preparing: '#f59e0b',
      ready: '#10b981',
      delivered: '#6b7280'
    },
    auto_accept: false,
    default_prep_time: 30,
    auto_print: false,
    selected_printer: 'default'
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - usando configurações do localStorage');
        loadFromLocalStorage();
        return;
      }

      const { data, error } = await supabase
        .from('order_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (error) {
        console.error('❌ Erro ao carregar configurações do banco:', error);
        loadFromLocalStorage();
        return;
      }

      if (data) {
        console.log('✅ Configurações carregadas do banco:', data);
        setSettings({
          sound_enabled: data.sound_enabled,
          sound_type: data.sound_type,
          sound_volume: data.sound_volume,
          auto_repeat: data.auto_repeat,
          repeat_interval: data.repeat_interval,
          channel_sounds: data.channel_sounds,
          popup_enabled: data.popup_enabled,
          badge_animation: data.badge_animation,
          status_colors: data.status_colors || {
            new: '#ef4444',
            preparing: '#f59e0b',
            ready: '#10b981',
            delivered: '#6b7280'
          },
          auto_accept: data.auto_accept,
          default_prep_time: data.default_prep_time,
          auto_print: data.auto_print,
          selected_printer: data.selected_printer
        });

        // Backup no localStorage
        saveToLocalStorage({
          sound_enabled: data.sound_enabled,
          sound_type: data.sound_type,
          sound_volume: data.sound_volume,
          auto_repeat: data.auto_repeat,
          repeat_interval: data.repeat_interval,
          channel_sounds: data.channel_sounds,
          popup_enabled: data.popup_enabled,
          badge_animation: data.badge_animation,
          status_colors: data.status_colors || {
            new: '#ef4444',
            preparing: '#f59e0b',
            ready: '#10b981',
            delivered: '#6b7280'
          },
          auto_accept: data.auto_accept,
          default_prep_time: data.default_prep_time,
          auto_print: data.auto_print,
          selected_printer: data.selected_printer
        });
      } else {
        console.log('ℹ️ Nenhuma configuração encontrada no banco, usando padrões');
        loadFromLocalStorage();
      }
    } catch (err) {
      console.error('❌ Erro ao buscar configurações:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar configurações');
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFromLocalStorage = () => {
    try {
      const savedSettings = localStorage.getItem('orderSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ 
          ...prev, 
          ...parsed,
          status_colors: parsed.status_colors || {
            new: '#ef4444',
            preparing: '#f59e0b',
            ready: '#10b981',
            delivered: '#6b7280'
          }
        }));
        console.log('✅ Configurações carregadas do localStorage');
      }
    } catch (error) {
      console.error('Erro ao carregar do localStorage:', error);
    }
  };

  const saveToLocalStorage = (settingsToSave: OrderSettings) => {
    try {
      localStorage.setItem('orderSettings', JSON.stringify(settingsToSave));
      
      // Also save individual settings for compatibility
      localStorage.setItem('orderSoundSettings', JSON.stringify({
        enabled: settingsToSave.sound_enabled,
        volume: settingsToSave.sound_volume / 100,
        soundUrl: settingsToSave.channel_sounds.delivery,
        soundType: settingsToSave.sound_type,
        autoRepeat: settingsToSave.auto_repeat,
        repeatInterval: settingsToSave.repeat_interval
      }));

      localStorage.setItem('chatSoundSettings', JSON.stringify({
        enabled: settingsToSave.sound_enabled,
        volume: settingsToSave.sound_volume / 100,
        soundUrl: settingsToSave.channel_sounds.attendance
      }));

      localStorage.setItem('pdv_settings', JSON.stringify({
        printer_layout: {
          auto_print_enabled: settingsToSave.auto_print,
          auto_print_delivery: settingsToSave.auto_print
        }
      }));
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  };

  const saveSettings = useCallback(async (newSettings: OrderSettings) => {
    try {
      setLoading(true);
      setError(null);

      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - salvando apenas no localStorage');
        saveToLocalStorage(newSettings);
        setSettings(newSettings);
        return;
      }

      const { data, error } = await supabase
        .from('order_settings')
        .upsert({
          id: 'default',
          sound_enabled: newSettings.sound_enabled,
          sound_type: newSettings.sound_type,
          sound_volume: newSettings.sound_volume,
          auto_repeat: newSettings.auto_repeat,
          repeat_interval: newSettings.repeat_interval,
          channel_sounds: newSettings.channel_sounds,
          popup_enabled: newSettings.popup_enabled,
          badge_animation: newSettings.badge_animation,
          status_colors: newSettings.status_colors,
          auto_accept: newSettings.auto_accept,
          default_prep_time: newSettings.default_prep_time,
          auto_print: newSettings.auto_print,
          selected_printer: newSettings.selected_printer,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao salvar no banco:', error);
        throw error;
      }

      console.log('✅ Configurações salvas no banco:', data);
      setSettings(newSettings);
      
      // Backup no localStorage
      saveToLocalStorage(newSettings);

    } catch (err) {
      console.error('❌ Erro ao salvar configurações:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar configurações');
      
      // Fallback para localStorage se banco falhar
      saveToLocalStorage(newSettings);
      setSettings(newSettings);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSetting = useCallback(async <K extends keyof OrderSettings>(
    key: K, 
    value: OrderSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  // Helper function to update repeat interval specifically
  const updateRepeatInterval = useCallback(async (interval: number) => {
    const clampedInterval = Math.max(10, Math.min(120, interval));
    await updateSetting('repeat_interval', clampedInterval);
  }, [updateSetting]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    saveSettings,
    updateSetting,
    updateRepeatInterval,
    refetch: fetchSettings
  };
};