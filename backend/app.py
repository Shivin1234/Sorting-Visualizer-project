# backend.py
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow frontend requests from different origin

# Bubble Sort implementation with steps
def bubble_sort(arr):
    steps = []
    a = arr.copy()
    n = len(a)
    for i in range(n-1):
        for j in range(n-i-1):
            steps.append({"type": "compare", "indices": [j, j+1]})
            if a[j] > a[j+1]:
                steps.append({"type": "swap", "indices": [j, j+1]})
                a[j], a[j+1] = a[j+1], a[j]
        steps.append({"type": "sorted", "index": n-1-i})
    steps.append({"type": "sorted", "index": 0})
    return steps

# Merge Sort with steps
def merge_sort(arr):
    steps = []
    a = arr.copy()
    def merge_sort_recursive(l, r):
        if l >= r:
            return
        m = (l + r) // 2
        merge_sort_recursive(l, m)
        merge_sort_recursive(m+1, r)
        # Merge step
        temp = []
        i, j = l, m+1
        while i <= m and j <= r:
            steps.append({"type": "compare", "indices": [i,j]})
            if a[i] <= a[j]:
                temp.append(a[i])
                i += 1
            else:
                temp.append(a[j])
                j += 1
        while i <= m:
            temp.append(a[i])
            i += 1
        while j <= r:
            temp.append(a[j])
            j += 1
        for idx, val in enumerate(temp):
            a[l + idx] = val
            steps.append({"type": "update_height", "index": l+idx, "newValue": val})
    merge_sort_recursive(0, len(a)-1)
    for i in range(len(a)):
        steps.append({"type": "sorted", "index": i})
    return steps

# Quick Sort with steps
def quick_sort(arr):
    steps = []
    a = arr.copy()
    def quick_sort_recursive(low, high):
        if low < high:
            pivot = a[high]
            i = low - 1
            for j in range(low, high):
                steps.append({"type": "compare", "indices": [j, high]})
                if a[j] < pivot:
                    i += 1
                    a[i], a[j] = a[j], a[i]
                    steps.append({"type": "swap", "indices": [i, j]})
            a[i+1], a[high] = a[high], a[i+1]
            steps.append({"type": "swap", "indices": [i+1, high]})
            quick_sort_recursive(low, i)
            quick_sort_recursive(i+2, high)
    quick_sort_recursive(0, len(a)-1)
    for i in range(len(a)):
        steps.append({"type": "sorted", "index": i})
    return steps

ALGORITHMS = {
    "BubbleSort": bubble_sort,
    "MergeSort": merge_sort,
    "QuickSort": quick_sort
}

@app.route("/sort", methods=["POST"])
def sort_array():
    data = request.get_json()
    arr = data.get("array", [])
    algo = data.get("algorithm", "BubbleSort")
    if algo not in ALGORITHMS:
        return jsonify({"error": "Algorithm not supported"}), 400
    import time
    start = time.time()
    steps = ALGORITHMS[algo](arr)
    duration = round((time.time() - start) * 1000, 2)  # ms
    return jsonify({"steps": steps, "simulatedDuration": duration})

if __name__ == "__main__":
    app.run(debug=True, port=8080)
