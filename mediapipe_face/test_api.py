import requests
import cv2
import base64
import numpy as np

# create a dummy image (e.g. from an actual face if we have one)
# I'll just load the sample image if it exists, or just use a dummy one.
# Wait, dummy image won't detect a face. We need a real face to trigger the geometry function.
# Or I'll just download a sample face image.
try:
    url = "https://raw.githubusercontent.com/opencv/opencv/master/samples/data/lena.jpg"
    r = requests.get(url)
    img_data = r.content
    with open("lena.jpg", "wb") as f:
        f.write(img_data)
except Exception as e:
    print("could not download:", e)

with open("lena.jpg", "rb") as f:
    b64_img = base64.b64encode(f.read()).decode()

resp = requests.post("http://localhost:5000/api/face/recognize/fused", json={"images": [b64_img]})
print(resp.status_code)
print(resp.text)
