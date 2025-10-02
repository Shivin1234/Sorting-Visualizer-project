// --- Configuration ---
const ARRAY_SIZE = 50;
const ANIMATION_SPEED_MS = 10;
const C_PLUS_PLUS_API_URL = 'http://localhost:8080/sort'; // Python backend URL
const MAX_VALUE = 200;

// --- DOM Elements ---
const arrayContainer = document.getElementById('array-container');
const generateBtn = document.getElementById('generate-array-btn');
const startSortBtn = document.getElementById('start-sort-btn');
const statusMessage = document.getElementById('status-message');
const algoButtons = document.querySelectorAll('.algo-btn');
const timeComplexityText = document.getElementById('time-complexity');
const spaceComplexityText = document.getElementById('space-complexity');
const timeTakenText = document.getElementById('time-taken');

// --- State ---
let currentArray = [];
let arrayBars = [];
let selectedAlgorithm = 'BubbleSort';

// --- Algorithm Metadata ---
const ALGO_METADATA = {
    BubbleSort: { time: 'O(N²)', space: 'O(1)', name: 'Bubble Sort' },
    MergeSort: { time: 'O(N log N)', space: 'O(N)', name: 'Merge Sort' },
    QuickSort: { time: 'O(N log N)', space: 'O(log N)', name: 'Quick Sort' },
};

// --- Utility Functions ---
const setAppState = (isSorting, message, colorClass = 'text-gray-600') => {
    generateBtn.disabled = isSorting;
    startSortBtn.disabled = isSorting || currentArray.length === 0;
    algoButtons.forEach(btn => btn.disabled = isSorting);
    statusMessage.textContent = message;
    statusMessage.className = `text-center py-2 text-sm font-medium ${colorClass} bg-white rounded-md border border-gray-200`;
};

const updateStatsPanel = (algo) => {
    const data = ALGO_METADATA[algo];
    timeComplexityText.textContent = data.time;
    spaceComplexityText.textContent = data.space;
    startSortBtn.textContent = `Start ${data.name}`;
    timeTakenText.textContent = '--- ms';
};

const generateNewArray = () => {
    currentArray = [];
    for (let i = 0; i < ARRAY_SIZE; i++) {
        currentArray.push(Math.floor(Math.random() * (MAX_VALUE - 5)) + 5);
    }
    renderArray(currentArray);
    setAppState(false, `Array ready. Selected: ${ALGO_METADATA[selectedAlgorithm].name}.`, 'text-green-600');
    timeTakenText.textContent = '--- ms';
};

const renderArray = (array) => {
    arrayContainer.innerHTML = '';
    arrayBars = [];

    const containerWidth = arrayContainer.clientWidth;
    const barCount = array.length;
    const margin = 2;
    const barWidth = (containerWidth / barCount) - (margin * 2);

    array.forEach((value, index) => {
        const bar = document.createElement('div');
        const height = (value / MAX_VALUE) * arrayContainer.clientHeight;
        const positionX = (index * (barWidth + (margin * 2))) + margin;

        bar.className = 'array-bar';
        bar.style.width = `${barWidth}px`;
        bar.style.height = `${height}px`;
        bar.style.transform = `translateX(${positionX}px)`;

        bar.setAttribute('data-value', value);
        bar.style.backgroundColor = 'var(--bar-color)';
        arrayContainer.appendChild(bar);
        arrayBars.push(bar);
    });
};

// --- Fetch sorting steps from Python backend ---
const getSortingStepsFromBackend = async () => {
    setAppState(true, `Requesting ${ALGO_METADATA[selectedAlgorithm].name} steps from Python backend...`, 'text-indigo-600');
    const startTime = performance.now();
    try {
        const response = await fetch(C_PLUS_PLUS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ array: currentArray, algorithm: selectedAlgorithm })
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        return { steps: data.steps, simulatedDuration: data.simulatedDuration };
    } catch (error) {
        setAppState(false, `Error connecting to Python backend: ${error}`, 'text-red-600');
        return { steps: [], simulatedDuration: 0 };
    }
};

// --- Animate sorting ---
const animateSorting = (steps, duration) => {
    const bars = arrayBars;

    steps.forEach((step, i) => {
        const { type, indices, index, newValue } = step;
        const delay = i * ANIMATION_SPEED_MS;

        if (type === 'compare') {
            setTimeout(() => {
                indices.forEach(idx => {
                    if (bars[idx] && bars[idx].style.backgroundColor !== 'var(--sorted-color)') {
                        bars[idx].style.backgroundColor = 'var(--compare-color)';
                    }
                });
            }, delay);
            setTimeout(() => {
                indices.forEach(idx => {
                    if (bars[idx] && bars[idx].style.backgroundColor !== 'var(--sorted-color)') {
                        bars[idx].style.backgroundColor = 'var(--bar-color)';
                    }
                });
            }, delay + ANIMATION_SPEED_MS);

        } else if (type === 'swap') {
            setTimeout(() => {
                indices.forEach(idx => {
                    bars[idx].style.backgroundColor = 'var(--swap-color)';
                });
                const [idxA, idxB] = indices;
                const barA = bars[idxA];
                const barB = bars[idxB];

                const transformA = barA.style.transform;
                barA.style.transform = barB.style.transform;
                barB.style.transform = transformA;

                [bars[idxA], bars[idxB]] = [bars[idxB], bars[idxA]];
            }, delay);
            setTimeout(() => {
                indices.forEach(idx => {
                    if (bars[idx].style.backgroundColor !== 'var(--sorted-color)') {
                        bars[idx].style.backgroundColor = 'var(--bar-color)';
                    }
                });
            }, delay + ANIMATION_SPEED_MS);

        } else if (type === 'update_height') {
            setTimeout(() => {
                if (bars[index]) {
                    bars[index].style.height = `${(newValue / MAX_VALUE) * arrayContainer.clientHeight}px`;
                }
            }, delay);
        } else if (type === 'sorted') {
            setTimeout(() => {
                if (bars[index]) bars[index].style.backgroundColor = 'var(--sorted-color)';
            }, delay);
        }
    });

    setTimeout(() => {
        setAppState(false, `${ALGO_METADATA[selectedAlgorithm].name} complete! Generate a new array to compare.`, 'text-indigo-600');
        timeTakenText.textContent = `${duration} ms`;
    }, steps.length * ANIMATION_SPEED_MS);
};

// --- Event Listeners ---
generateBtn.addEventListener('click', generateNewArray);

window.addEventListener('resize', () => {
    if (currentArray.length > 0) renderArray(currentArray);
});

algoButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        algoButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        selectedAlgorithm = e.target.getAttribute('data-algo');
        updateStatsPanel(selectedAlgorithm);
        setAppState(false, `Algorithm set to ${ALGO_METADATA[selectedAlgorithm].name}. Click Start Sort.`, 'text-blue-600');
    });
});

startSortBtn.addEventListener('click', async () => {
    if (currentArray.length === 0) {
        setAppState(false, 'Please generate an array first.', 'text-red-500');
        return;
    }
    const result = await getSortingStepsFromBackend();
    if (result && result.steps && result.steps.length > 0) {
        arrayBars.forEach(bar => bar.style.backgroundColor = 'var(--bar-color)');
        animateSorting(result.steps, result.simulatedDuration);
    } else {
        setAppState(false, 'Error: No steps received from the backend.', 'text-red-600');
    }
});

// --- Initialization ---
updateStatsPanel(selectedAlgorithm);
generateNewArray();
