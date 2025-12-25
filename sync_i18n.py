import os
import json
import re

constants_path = "/home/andres/Documents/Projects/Hal_Test_v0/apps/frontend/src/components/hooks/constants.js"
en_json_path = "/home/andres/Documents/Projects/Hal_Test_v0/apps/frontend/src/locales/en.json"
es_json_path = "/home/andres/Documents/Projects/Hal_Test_v0/apps/frontend/src/locales/es.json"

with open(en_json_path, 'r') as f:
    en_json = json.load(f)
with open(es_json_path, 'r') as f:
    es_json = json.load(f)

with open(constants_path, 'r') as f:
    content = f.read()

# Ensure base structure
for d in [en_json, es_json]:
    if "nodes" not in d: d["nodes"] = {}
    for sub in ["fields", "placeholders", "hints", "options"]:
        if sub not in d["nodes"]: d["nodes"][sub] = {}

# Find all field definitions
field_blocks = re.findall(r'\{\s*name:\s*"([^"]+)"(.*?)\}', content, re.DOTALL)

for name, body in field_blocks:
    # 1. Labels
    label_match = re.search(r'label:\s*"([^"]+)"', body)
    if label_match:
        val = label_match.group(1)
        if not val.startswith("nodes."):
            if name not in en_json["nodes"]["fields"]:
                en_json["nodes"]["fields"][name] = val
            if name not in es_json["nodes"]["fields"]:
                es_json["nodes"]["fields"][name] = val

    # 2. Placeholders
    ph_match = re.search(r'placeholder:\s*"([^"]+)"', body)
    if ph_match:
        val = ph_match.group(1)
        if not val.startswith("nodes."):
            if name not in en_json["nodes"]["placeholders"]:
                en_json["nodes"]["placeholders"][name] = val
            if name not in es_json["nodes"]["placeholders"]:
                es_json["nodes"]["placeholders"][name] = val

    # 3. Hints
    hint_match = re.search(r'hint:\s*"([^"]+)"', body)
    if hint_match:
        val = hint_match.group(1)
        if not val.startswith("nodes."):
            if name not in en_json["nodes"]["hints"]:
                en_json["nodes"]["hints"][name] = val
            if name not in es_json["nodes"]["hints"]:
                es_json["nodes"]["hints"][name] = val

    # 4. Options
    opt_blocks = re.findall(r'\{\s*value:\s*"([^"]+)",\s*label:\s*"([^"]+)"\s*\}', body)
    for opt_val, opt_label in opt_blocks:
        if name not in en_json["nodes"]["options"]: en_json["nodes"]["options"][name] = {}
        if name not in es_json["nodes"]["options"]: es_json["nodes"]["options"][name] = {}
        
        if opt_val not in en_json["nodes"]["options"][name]:
            en_json["nodes"]["options"][name][opt_val] = opt_label
        if opt_val not in es_json["nodes"]["options"][name]:
            es_json["nodes"]["options"][name][opt_val] = opt_label

# Save updated JSONs
with open(en_json_path, 'w') as f:
    json.dump(en_json, f, indent=4, ensure_ascii=False)
with open(es_json_path, 'w') as f:
    json.dump(es_json, f, indent=4, ensure_ascii=False)

print("✅ JSON Locales synchronized with field names from constants.js")
