import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export const startExtraction = async (
  userId: string,
  type: 'followers' | 'following' | 'hashtag',
  target: string,
  creditsToUse: number,
  settings: Record<string, any> = {}
) => {
  const { data, error } = await supabase.rpc('start_extraction', {
    user_id: userId,
    extraction_type: type,
    target,
    credits_to_use: creditsToUse,
    settings
  });

  if (error) throw error;
  return data;
};

export const getExtractions = async (userId: string) => {
  const { data, error } = await supabase
    .from('extractions')
    .select(`
      *,
      extraction_data (
        data
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getExtraction = async (extractionId: string, userId: string) => {
  const { data, error } = await supabase
    .from('extractions')
    .select(`
      *,
      extraction_data (
        data
      )
    `)
    .eq('id', extractionId)
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
};

export const updateExtractionProgress = async (
  extractionId: string,
  status: string,
  recordsExtracted?: number,
  error?: string,
  lastProcessedId?: string
) => {
  const { error: updateError } = await supabase.rpc('update_extraction_progress', {
    extraction_id: extractionId,
    new_status: status,
    records_extracted: recordsExtracted,
    error_message: error,
    last_id: lastProcessedId
  });

  if (updateError) throw updateError;
};

export const saveExtractionData = async (
  extractionId: string,
  data: Record<string, any>[]
) => {
  const { error } = await supabase
    .from('extraction_data')
    .insert(data.map(item => ({
      extraction_id: extractionId,
      data: item
    })));

  if (error) throw error;
};
