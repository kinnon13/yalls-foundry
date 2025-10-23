#!/bin/bash
# Quick list of all actual function folders

echo "📁 ALL ACTUAL FUNCTION FOLDERS:"
echo "================================"
ls -1 supabase/functions/ | grep -v "^_" | sort
echo ""
echo "Total: $(ls -1 supabase/functions/ | grep -v '^_' | wc -l)"
