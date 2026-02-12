#!/bin/bash
# Quick sync helper - Interactive mode

echo "=== Lyrics Timing Sync Tool ==="
echo ""

# Check if Python and dependencies are available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required"
    exit 1
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Prompt for inputs
read -p "Audio file path: " AUDIO_PATH
read -p "Artist name: " ARTIST
read -p "Track title: " TITLE
read -p "Hook term (main word to decode): " HOOK_TERM
read -p "Difficulty (1-5) [3]: " DIFFICULTY
DIFFICULTY=${DIFFICULTY:-3}

# Create temp lyrics file
LYRICS_FILE=$(mktemp /tmp/lyrics_XXXXXX.txt)
echo "Enter lyrics (one line per line, empty line to finish):"
while IFS= read -r line; do
    [[ -z "$line" ]] && break
    echo "$line" >> "$LYRICS_FILE"
done

# Run sync
OUTPUT_FILE="$PROJECT_DIR/src/data/autobahn.json"

echo ""
echo "Running sync..."
python3 "$SCRIPT_DIR/sync_lyrics.py" \
    --audio "$AUDIO_PATH" \
    --lyrics "$LYRICS_FILE" \
    --output "$OUTPUT_FILE" \
    --artist "$ARTIST" \
    --title "$TITLE" \
    --hook-term "$HOOK_TERM" \
    --difficulty "$DIFFICULTY" \
    --model "medium"

# Cleanup
rm -f "$LYRICS_FILE"

echo ""
echo "Done! Output: $OUTPUT_FILE"
echo "You can now preview with: cd $PROJECT_DIR && npm run dev"
