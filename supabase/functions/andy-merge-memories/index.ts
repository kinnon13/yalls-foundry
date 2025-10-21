import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Merge user + Andy memories into combined hierarchical files
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { user_id } = await req.json();
    console.log('🔀 Merging user + Andy memories...');

    // Get user memories and Andy's enhancements
    const [memories, enhancements] = await Promise.all([
      supabase
        .from('rocker_long_memory')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('andy_memory_enhancements')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(100)
    ]);

    // Group by topic/category for file structure
    const memoryGroups = new Map<string, any[]>();

    for (const mem of memories.data || []) {
      const category = mem.kind || 'uncategorized';
      if (!memoryGroups.has(category)) {
        memoryGroups.set(category, []);
      }
      memoryGroups.get(category)!.push(mem);
    }

    console.log(`📁 Creating ${memoryGroups.size} category files...`);
    const mergedFiles: any[] = [];

    for (const [category, categoryMems] of memoryGroups.entries()) {
      // Get Andy's enhancements for these memories
      const relatedEnhancements = (enhancements.data || []).filter(enh => 
        categoryMems.some(m => m.id === enh.source_memory_id)
      );

      // Create main category file
      const mainFile = {
        user_id,
        file_name: `${category}.md`,
        file_path: `/${category}`,
        parent_file_id: null,
        user_memory_ids: categoryMems.map(m => m.id),
        andy_research_ids: relatedEnhancements.map(e => e.id),
        merge_reasoning: `Combined ${categoryMems.length} user memories with ${relatedEnhancements.length} Andy enhancements`,
        content: {
          category,
          user_memories: categoryMems.slice(0, 20).map(m => ({
            key: m.key,
            value: m.value,
            created_at: m.created_at
          })),
          andy_insights: relatedEnhancements.slice(0, 10).map(e => ({
            enhancement_type: e.enhancement_type,
            enhanced_content: e.enhanced_content,
            reasoning: e.reasoning
          })),
          merged_at: new Date().toISOString()
        },
        confidence: 0.8
      };

      // Insert main file
      const { data: mainFileData, error: mainError } = await supabase
        .from('combined_memory_files')
        .insert(mainFile)
        .select()
        .single();

      if (mainError) {
        console.error('Failed to create main file:', mainError);
        continue;
      }

      mergedFiles.push(mainFileData);

      // Create sub-files for detailed analysis
      const subFileGroups = new Map<string, any[]>();
      
      for (const mem of categoryMems.slice(0, 20)) {
        const subCategory = (mem.value?.type || mem.memory_layer || 'general') as string;
        if (!subFileGroups.has(subCategory)) {
          subFileGroups.set(subCategory, []);
        }
        subFileGroups.get(subCategory)!.push(mem);
      }

      for (const [subCat, subMems] of subFileGroups.entries()) {
        const subFile = {
          user_id,
          file_name: `${subCat}.md`,
          file_path: `/${category}/${subCat}`,
          parent_file_id: mainFileData.id,
          user_memory_ids: subMems.map(m => m.id),
          andy_research_ids: [],
          merge_reasoning: `Sub-category analysis of ${subCat}`,
          content: {
            parent_category: category,
            sub_category: subCat,
            memories: subMems.map(m => ({
              key: m.key,
              value: m.value,
              confidence: m.confidence || 0.7
            }))
          },
          confidence: 0.75
        };

        await supabase
          .from('combined_memory_files')
          .insert(subFile)
          .then(({ data }) => data && mergedFiles.push(data));

        await new Promise(r => setTimeout(r, 50));
      }
    }

    console.log(`✅ Created ${mergedFiles.length} combined memory files`);

    return new Response(JSON.stringify({ 
      ok: true, 
      files_created: mergedFiles.length,
      categories: memoryGroups.size
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error in andy-merge-memories:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
