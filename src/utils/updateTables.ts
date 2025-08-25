import { supabase } from '../lib/supabase';

export async function updateTablesStatus() {
  try {
    console.log('🔄 Atualizando status das mesas 1, 2 e 3...');

    // Atualizar mesa 1 da loja 1
    const { error: error1 } = await supabase
      .from('store1_tables')
      .update({ 
        status: 'livre',
        current_sale_id: null
      })
      .eq('number', 1);

    if (error1) {
      console.error('❌ Erro ao atualizar mesa 1:', error1);
    } else {
      console.log('✅ Mesa 1 atualizada para livre');
    }

    // Atualizar mesa 2 da loja 1
    const { error: error2 } = await supabase
      .from('store1_tables')
      .update({ 
        status: 'livre',
        current_sale_id: null
      })
      .eq('number', 2);

    if (error2) {
      console.error('❌ Erro ao atualizar mesa 2:', error2);
    } else {
      console.log('✅ Mesa 2 atualizada para livre');
    }

    // Atualizar mesa 3 da loja 1
    const { error: error3 } = await supabase
      .from('store1_tables')
      .update({ 
        status: 'livre',
        current_sale_id: null
      })
      .eq('number', 3);

    if (error3) {
      console.error('❌ Erro ao atualizar mesa 3:', error3);
    } else {
      console.log('✅ Mesa 3 atualizada para livre');
    }

    // Também atualizar na loja 2
    const { error: error1Store2 } = await supabase
      .from('store2_tables')
      .update({ 
        status: 'livre',
        current_sale_id: null
      })
      .eq('number', 1);

    if (error1Store2) {
      console.error('❌ Erro ao atualizar mesa 1 loja 2:', error1Store2);
    } else {
      console.log('✅ Mesa 1 loja 2 atualizada para livre');
    }

    const { error: error2Store2 } = await supabase
      .from('store2_tables')
      .update({ 
        status: 'livre',
        current_sale_id: null
      })
      .eq('number', 2);

    if (error2Store2) {
      console.error('❌ Erro ao atualizar mesa 2 loja 2:', error2Store2);
    } else {
      console.log('✅ Mesa 2 loja 2 atualizada para livre');
    }

    const { error: error3Store2 } = await supabase
      .from('store2_tables')
      .update({ 
        status: 'livre',
        current_sale_id: null
      })
      .eq('number', 3);

    if (error3Store2) {
      console.error('❌ Erro ao atualizar mesa 3 loja 2:', error3Store2);
    } else {
      console.log('✅ Mesa 3 loja 2 atualizada para livre');
    }

    return true;
  } catch (error) {
    console.error('❌ Erro geral ao atualizar mesas:', error);
    return false;
  }
}