import { supabaseDataService } from '../services/supabaseDataService';

export const testSupabaseConnection = async () => {
  console.log('Testing Supabase connection...');
  
  try {
    // Test 1: Get all collections
    const collections = await supabaseDataService.getAllCollections();
    console.log(`✅ Found ${collections.length} collections`);
    
    // Test 2: Get Smart7 collections
    const smart7 = await supabaseDataService.getSmart7Collections();
    console.log(`✅ Found ${smart7.length} Smart7 collections`);
    
    // Test 3: Get amenities for a collection
    if (smart7.length > 0) {
      const amenities = await supabaseDataService.getCollectionAmenities(
        smart7[0].collection_id
      );
      console.log(`✅ Found ${amenities.length} amenities in ${smart7[0].name}`);
    }
    
    // Test 4: Get terminal amenities
    const terminalAmenities = await supabaseDataService.getTerminalAmenities('SYD-T1');
    console.log(`✅ Found ${terminalAmenities.length} amenities in SYD-T1`);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error };
  }
};
