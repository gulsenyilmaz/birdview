import json
import requests

API_URL = "https://digitalssm.org/digital/bl/dmwebservices/index.php"

params = {
    "q": "dmGetCollectionFieldVocabulary/ResimKlksyn/typeb/0/0/json"
}

response = requests.get(API_URL, params=params, timeout=60)
response.raise_for_status()

data = response.json()

with open(
    "ssm_artists_vocabulary.json",
    "w",
    encoding="utf-8"
) as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Response type:", type(data))

if isinstance(data, list):
    print("Sanatçı/terim sayısı:", len(data))
    print("İlk 10:")
    for x in data[:10]:
        print(x)
else:
    print(data)

print("ssm_artists_vocabulary.json oluşturuldu.")