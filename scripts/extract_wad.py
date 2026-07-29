"""
Extract TFT game data from League of Legends WAD v3 archives.
Writes extracted JSON files to data/raw_tft_data/.
"""
import struct
import lz4.block
import json
import os
import sys
from pathlib import Path

WAD_PATH = r"C:\Riot Games\League of Legends\Game\DATA\FINAL\TFTSet17.wad.client"
OUTPUT_DIR = Path(os.path.dirname(os.path.abspath(__file__))) / ".." / "data" / "raw_tft_data"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def read_header(f):
    magic = f.read(2)
    assert magic == b'RW', f"Bad magic: {magic}"
    version_byte = struct.unpack('<B', f.read(1))[0]
    f.seek(0)
    data = f.read(256)
    
    # Try to parse header structure
    # Known fields:
    magic, ver, checksum_type, comp_type, enc_type = struct.unpack('<2sBBBB', data[:6])
    path_count, content_count = struct.unpack('<II', data[6:14])
    path_offset, content_offset = struct.unpack('<QQ', data[14:30])
    path_size, content_size = struct.unpack('<QQ', data[30:46])
    file_type = struct.unpack('<I', data[46:50])[0]
    file_checksum = struct.unpack('<Q', data[50:58])[0]
    file_size = struct.unpack('<Q', data[58:66])[0]
    
    print(f"=== WAD Header ===")
    print(f"Version:         {ver}")
    print(f"Checksum type:   {checksum_type}")
    print(f"Compression:     {comp_type} (1=lz4)")
    print(f"Encryption:      {enc_type}")
    print(f"Path count:      {path_count}")
    print(f"Content count:   {content_count}")
    print(f"Path offset:     {path_offset}")
    print(f"Content offset:  {content_offset}")
    print(f"Path size:       {path_size}")
    print(f"Content size:    {content_size}")
    print(f"File type:       {file_type}")
    print(f"File checksum:   {file_checksum:016X}")
    print(f"File size:       {file_size}")
    
    return {
        'ver': ver, 'checksum_type': checksum_type, 'comp_type': comp_type,
        'enc_type': enc_type, 'path_count': path_count, 'content_count': content_count,
        'path_offset': path_offset, 'content_offset': content_offset,
        'path_size': path_size, 'content_size': content_size,
        'file_type': file_type, 'file_checksum': file_checksum, 'file_size': file_size
    }

def read_path_table(f, hdr):
    if hdr['path_offset'] == 0 or hdr['path_count'] == 0:
        print("No path table")
        return {}
    
    f.seek(hdr['path_offset'])
    paths = {}
    for i in range(hdr['path_count']):
        rec = f.read(16)
        path_hash, str_offset, str_len = struct.unpack('<QII', rec)
        
        # Save current position
        pos = f.tell()
        
        # Read string from path string area
        str_area_offset = hdr['path_offset'] + hdr['path_count'] * 16
        f.seek(str_area_offset + str_offset)
        path_bytes = f.read(str_len)
        path = path_bytes.decode('utf-8', errors='replace')
        paths[path_hash] = path
        
        # Restore position
        f.seek(pos)
    
    return paths

def read_content_table(f, hdr):
    if hdr['content_offset'] == 0 or hdr['content_count'] == 0:
        print("No content table")
        return []
    
    f.seek(hdr['content_offset'])
    contents = []
    for i in range(hdr['content_count']):
        rec = f.read(32)
        path_hash, offset, size, comp_size = struct.unpack('<QQQQ', rec[:32])
        type_info = struct.unpack('<I', rec[32:36])[0]
        comp_type = struct.unpack('<B', rec[36:37])[0]
        enc_type = struct.unpack('<B', rec[37:38])[0]
        
        contents.append({
            'path_hash': path_hash,
            'offset': offset,
            'size': size,
            'comp_size': comp_size,
            'type': type_info,
            'comp_type': comp_type,
            'enc_type': enc_type
        })
    
    return contents

def extract_file(f, content, paths, wad_name):
    path = paths.get(content['path_hash'], f"unknown_{content['path_hash']:016X}")
    
    f.seek(content['offset'])
    data = f.read(content['comp_size'] if content['comp_size'] > 0 else content['size'])
    
    try:
        if content['comp_type'] == 1:
            decompressed = lz4.block.decompress(data, uncompressed_size=content['size'])
        elif content['comp_type'] == 0:
            decompressed = data
        else:
            print(f"  Unknown compression: {content['comp_type']}")
            return None
        
        # Save extracted file
        save_path = OUTPUT_DIR / wad_name / path.lstrip('/')
        save_path.parent.mkdir(parents=True, exist_ok=True)
        save_path.write_bytes(decompressed)
        
        # If it's JSON, return the parsed data
        if path.endswith('.json'):
            try:
                return json.loads(decompressed)
            except:
                return None
        
        return None
    except Exception as e:
        print(f"  Error extracting {path}: {e}")
        return None

def extract_tft_data():
    wad_path = Path(WAD_PATH)
    wad_name = wad_path.stem.replace('.wad', '')
    
    print(f"Opening {wad_path}...")
    with open(wad_path, 'rb') as f:
        hdr = read_header(f)
        paths = read_path_table(f, hdr)
        
        print(f"\n=== Path table: {len(paths)} entries ===")
        tft_paths = {k: v for k, v in paths.items() if 'tft' in v.lower()}
        print(f"TFT-related paths: {len(tft_paths)}")
        for h, p in sorted(tft_paths.items(), key=lambda x: x[1]):
            print(f"  {p}")
        
        contents = read_content_table(f, hdr)
        print(f"\n=== Content table: {len(contents)} entries ===")
        
        # Find TFT-related content records
        tft_contents = []
        other_sample = []
        for c in contents:
            p = paths.get(c['path_hash'], '')
            if 'tft' in p.lower() or 'tft' in p.lower():
                tft_contents.append((paths.get(c['path_hash'], f"???_{c['path_hash']:016X}"), c))
            elif len(other_sample) < 5:
                other_sample.append((paths.get(c['path_hash'], f"???_{c['path_hash']:016X}"), c))
        
        print(f"\nTFT content entries: {len(tft_contents)}")
        print(f"Sample other entries:")
        for p, c in sorted(other_sample, key=lambda x: x[0]):
            print(f"  {p} (size={c['size']}, comp={c['comp_size']})")
        
        # Extract JSON files
        print(f"\n=== Extracting TFT JSON files ===")
        for path, content in tft_contents:
            if path.endswith('.json'):
                print(f"Extracting: {path}")
                data = extract_file(f, content, paths, wad_name)
                if data:
                    json_path = OUTPUT_DIR / wad_name / path.lstrip('/')
                    with open(str(json_path).replace('.json', '.parsed.json'), 'w') as jf:
                        json.dump(data, jf, indent=2)
                    print(f"  -> {len(data)} entries" if isinstance(data, list) else f"  -> dict with keys: {list(data.keys())[:5]}")

if __name__ == '__main__':
    extract_tft_data()
