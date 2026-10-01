"""Bind rendered MP3 bytes to the exact source script and rendering settings."""
import hashlib
import json
import os

def script_hash(script):
    return hashlib.sha256(script.strip().encode('utf-8')).hexdigest()

def receipt_for(item):
    with open(item['path'], 'rb') as audio:
        audio_hash = hashlib.sha256(audio.read()).hexdigest()
    return {'script_sha256': script_hash(item['script']), 'audio_sha256': audio_hash,
            'voice': item['voice'], 'rate': item['rate']}

def audio_is_current(item):
    try:
        if os.path.getsize(item['path']) < 1000:
            return False
        with open(item['path'] + '.json', encoding='utf-8') as receipt:
            return json.load(receipt) == receipt_for(item)
    except (OSError, ValueError):
        return False

def write_receipt(item):
    tmp = item['path'] + '.json.part'
    with open(tmp, 'w', encoding='utf-8') as receipt:
        json.dump(receipt_for(item), receipt, ensure_ascii=False)
    os.replace(tmp, item['path'] + '.json')
