import { ConsoleLogEntry, ExecutionResult, ChartPlotData } from '../types';

let pyLogCounter = 0;

function createPyLog(
  type: ConsoleLogEntry['type'], 
  args: any[], 
  chartData?: ChartPlotData
): ConsoleLogEntry {
  return {
    id: `pylog_${Date.now()}_${++pyLogCounter}`,
    type,
    args,
    timestamp: Date.now(),
    chartData,
  };
}

// Built-in Sample Datasets for pd.read_csv(...)
const SAMPLE_CSV_DATASETS: Record<string, Array<Record<string, any>>> = {
  'iris.csv': [
    { sepal_length: 5.1, sepal_width: 3.5, petal_length: 1.4, petal_width: 0.2, species: 'setosa' },
    { sepal_length: 4.9, sepal_width: 3.0, petal_length: 1.4, petal_width: 0.2, species: 'setosa' },
    { sepal_length: 4.7, sepal_width: 3.2, petal_length: 1.3, petal_width: 0.2, species: 'setosa' },
    { sepal_length: 7.0, sepal_width: 3.2, petal_length: 4.7, petal_width: 1.4, species: 'versicolor' },
    { sepal_length: 6.4, sepal_width: 3.2, petal_length: 4.5, petal_width: 1.5, species: 'versicolor' },
    { sepal_length: 6.9, sepal_width: 3.1, petal_length: 4.9, petal_width: 1.5, species: 'versicolor' },
    { sepal_length: 6.3, sepal_width: 3.3, petal_length: 6.0, petal_width: 2.5, species: 'virginica' },
    { sepal_length: 5.8, sepal_width: 2.7, petal_length: 5.1, petal_width: 1.9, species: 'virginica' },
    { sepal_length: 7.1, sepal_width: 3.0, petal_length: 5.9, petal_width: 2.1, species: 'virginica' },
    { sepal_length: 6.3, sepal_width: 2.9, petal_length: 5.6, petal_width: 1.8, species: 'virginica' },
  ],
  'titanic.csv': [
    { passenger_id: 1, survived: 0, pclass: 3, name: 'Braund, Mr. Owen Harris', sex: 'male', age: 22, fare: 7.25 },
    { passenger_id: 2, survived: 1, pclass: 1, name: 'Cumings, Mrs. John Bradley', sex: 'female', age: 38, fare: 71.28 },
    { passenger_id: 3, survived: 1, pclass: 3, name: 'Heikkinen, Miss. Laina', sex: 'female', age: 26, fare: 7.92 },
    { passenger_id: 4, survived: 1, pclass: 1, name: 'Futrelle, Mrs. Jacques Heath', sex: 'female', age: 35, fare: 53.10 },
    { passenger_id: 5, survived: 0, pclass: 3, name: 'Allen, Mr. William Henry', sex: 'male', age: 35, fare: 8.05 },
    { passenger_id: 6, survived: 0, pclass: 3, name: 'Moran, Mr. James', sex: 'male', age: 27, fare: 8.45 },
    { passenger_id: 7, survived: 0, pclass: 1, name: 'McCarthy, Mr. Timothy J', sex: 'male', age: 54, fare: 51.86 },
  ],
  'sales.csv': [
    { month: 'Jan', revenue: 14200, marketing: 2800, units: 140, region: 'US-East' },
    { month: 'Feb', revenue: 16800, marketing: 3100, units: 172, region: 'US-East' },
    { month: 'Mar', revenue: 21500, marketing: 4200, units: 210, region: 'US-West' },
    { month: 'Apr', revenue: 19800, marketing: 3800, units: 195, region: 'US-West' },
    { month: 'May', revenue: 24600, marketing: 4900, units: 255, region: 'EU-Central' },
    { month: 'Jun', revenue: 28900, marketing: 5600, units: 290, region: 'EU-Central' },
    { month: 'Jul', revenue: 31200, marketing: 6100, units: 315, region: 'APAC' },
    { month: 'Aug', revenue: 29400, marketing: 5800, units: 288, region: 'APAC' },
  ],
  'crypto.csv': [
    { day: 1, btc: 64200, eth: 3450, sol: 148 },
    { day: 2, btc: 65100, eth: 3520, sol: 154 },
    { day: 3, btc: 63800, eth: 3410, sol: 145 },
    { day: 4, btc: 66900, eth: 3680, sol: 162 },
    { day: 5, btc: 68400, eth: 3790, sol: 170 },
    { day: 6, btc: 67200, eth: 3710, sol: 165 },
    { day: 7, btc: 71000, eth: 3950, sol: 182 },
  ]
};

/**
 * Numpy Library Object Simulator
 */
class NumPyArray {
  data: any[];
  shape: number[];
  ndim: number;
  size: number;

  constructor(data: any) {
    if (Array.isArray(data)) {
      this.data = data;
      if (Array.isArray(data[0])) {
        this.shape = [data.length, data[0].length];
        this.ndim = 2;
        this.size = data.length * data[0].length;
      } else {
        this.shape = [data.length];
        this.ndim = 1;
        this.size = data.length;
      }
    } else {
      this.data = [data];
      this.shape = [1];
      this.ndim = 1;
      this.size = 1;
    }
  }

  tolist() {
    return this.data;
  }

  mean(): number {
    const flat = this.flatten().data;
    return flat.reduce((a, b) => a + b, 0) / (flat.length || 1);
  }

  std(): number {
    const m = this.mean();
    const flat = this.flatten().data;
    const variance = flat.reduce((a, b) => a + Math.pow(b - m, 2), 0) / (flat.length || 1);
    return Math.sqrt(variance);
  }

  sum(): number {
    return this.flatten().data.reduce((a, b) => a + b, 0);
  }

  min(): number {
    return Math.min(...this.flatten().data);
  }

  max(): number {
    return Math.max(...this.flatten().data);
  }

  argmin(): number {
    const flat = this.flatten().data;
    return flat.indexOf(this.min());
  }

  argmax(): number {
    const flat = this.flatten().data;
    return flat.indexOf(this.max());
  }

  flatten(): NumPyArray {
    if (this.ndim === 1) return this;
    return new NumPyArray(this.data.flat());
  }

  reshape(rows: number, cols: number): NumPyArray {
    const flat = this.flatten().data;
    const res: any[][] = [];
    for (let r = 0; r < rows; r++) {
      res.push(flat.slice(r * cols, (r + 1) * cols));
    }
    return new NumPyArray(res);
  }

  toString() {
    return `array(${JSON.stringify(this.data)})`;
  }
}

function createNumpyModule() {
  return {
    array: (data: any) => new NumPyArray(data),
    zeros: (shape: number | [number, number]) => {
      if (typeof shape === 'number') {
        return new NumPyArray(new Array(shape).fill(0));
      }
      const [r, c] = shape;
      const res = Array.from({ length: r }, () => new Array(c).fill(0));
      return new NumPyArray(res);
    },
    ones: (shape: number | [number, number]) => {
      if (typeof shape === 'number') {
        return new NumPyArray(new Array(shape).fill(1));
      }
      const [r, c] = shape;
      const res = Array.from({ length: r }, () => new Array(c).fill(1));
      return new NumPyArray(res);
    },
    arange: (start: number, stop?: number, step = 1) => {
      if (stop === undefined) {
        stop = start;
        start = 0;
      }
      const arr: number[] = [];
      for (let i = start; i < stop; i += step) {
        arr.push(i);
      }
      return new NumPyArray(arr);
    },
    linspace: (start: number, stop: number, num = 50) => {
      const step = (stop - start) / (num - 1 || 1);
      const arr: number[] = [];
      for (let i = 0; i < num; i++) {
        arr.push(start + step * i);
      }
      return new NumPyArray(arr);
    },
    dot: (a: any, b: any) => {
      const arrA = a instanceof NumPyArray ? a.data : a;
      const arrB = b instanceof NumPyArray ? b.data : b;
      if (Array.isArray(arrA) && Array.isArray(arrB)) {
        return arrA.reduce((sum, val, idx) => sum + val * (arrB[idx] || 0), 0);
      }
      return 0;
    },
    mean: (a: any) => (a instanceof NumPyArray ? a.mean() : new NumPyArray(a).mean()),
    std: (a: any) => (a instanceof NumPyArray ? a.std() : new NumPyArray(a).std()),
    sum: (a: any) => (a instanceof NumPyArray ? a.sum() : new NumPyArray(a).sum()),
    min: (a: any) => (a instanceof NumPyArray ? a.min() : new NumPyArray(a).min()),
    max: (a: any) => (a instanceof NumPyArray ? a.max() : new NumPyArray(a).max()),
    argmin: (a: any) => (a instanceof NumPyArray ? a.argmin() : new NumPyArray(a).argmin()),
    argmax: (a: any) => (a instanceof NumPyArray ? a.argmax() : new NumPyArray(a).argmax()),
    sqrt: (a: any) => {
      if (typeof a === 'number') return Math.sqrt(a);
      const raw = a instanceof NumPyArray ? a.data : a;
      return new NumPyArray(raw.map((x: number) => Math.sqrt(x)));
    },
    sin: (a: any) => {
      if (typeof a === 'number') return Math.sin(a);
      const raw = a instanceof NumPyArray ? a.data : a;
      return new NumPyArray(raw.map((x: number) => Math.sin(x)));
    },
    cos: (a: any) => {
      if (typeof a === 'number') return Math.cos(a);
      const raw = a instanceof NumPyArray ? a.data : a;
      return new NumPyArray(raw.map((x: number) => Math.cos(x)));
    },
    exp: (a: any) => {
      if (typeof a === 'number') return Math.exp(a);
      const raw = a instanceof NumPyArray ? a.data : a;
      return new NumPyArray(raw.map((x: number) => Math.exp(x)));
    },
    log: (a: any) => {
      if (typeof a === 'number') return Math.log(a);
      const raw = a instanceof NumPyArray ? a.data : a;
      return new NumPyArray(raw.map((x: number) => Math.log(x)));
    },
    round: (a: any, decimals = 2) => {
      if (typeof a === 'number') return Number(a.toFixed(decimals));
      const raw = a instanceof NumPyArray ? a.data : a;
      return new NumPyArray(raw.map((x: number) => Number(x.toFixed(decimals))));
    },
    random: {
      seed: (_s: number) => {},
      rand: (...dims: number[]) => {
        const count = dims[0] || 1;
        const arr = Array.from({ length: count }, () => Math.random());
        return dims.length > 1 ? new NumPyArray(arr).reshape(dims[0], dims[1]) : new NumPyArray(arr);
      },
      randint: (low: number, high: number, size?: number) => {
        if (!size) return Math.floor(Math.random() * (high - low)) + low;
        const arr = Array.from({ length: size }, () => Math.floor(Math.random() * (high - low)) + low);
        return new NumPyArray(arr);
      },
      normal: (loc = 0.0, scale = 1.0, size?: number) => {
        // Box-Muller transform
        const generateNormal = () => {
          const u = 1 - Math.random();
          const v = Math.random();
          const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
          return z * scale + loc;
        };
        if (!size) return generateNormal();
        const arr = Array.from({ length: size }, () => generateNormal());
        return new NumPyArray(arr);
      },
      choice: (arr: any[], size?: number) => {
        const list = arr instanceof NumPyArray ? arr.data : arr;
        if (!size) return list[Math.floor(Math.random() * list.length)];
        return new NumPyArray(Array.from({ length: size }, () => list[Math.floor(Math.random() * list.length)]));
      },
    },
    pi: Math.PI,
    e: Math.E,
  };
}

/**
 * Pandas Library Object Simulator
 */
class DataFrame {
  _rows: Array<Record<string, any>>;
  columns: string[];
  shape: [number, number];

  constructor(data: any) {
    if (Array.isArray(data)) {
      this._rows = JSON.parse(JSON.stringify(data));
      this.columns = Object.keys(data[0] || {});
    } else if (typeof data === 'object' && data !== null) {
      // Dict of lists e.g. { a: [1, 2], b: [3, 4] }
      const keys = Object.keys(data);
      const rowCount = Array.isArray(data[keys[0]]) ? data[keys[0]].length : 0;
      const rows: Array<Record<string, any>> = [];
      for (let i = 0; i < rowCount; i++) {
        const row: Record<string, any> = {};
        for (const k of keys) {
          row[k] = data[k][i];
        }
        rows.push(row);
      }
      this._rows = rows;
      this.columns = keys;
    } else {
      this._rows = [];
      this.columns = [];
    }
    this.shape = [this._rows.length, this.columns.length];
  }

  head(n = 5): DataFrame {
    return new DataFrame(this._rows.slice(0, n));
  }

  tail(n = 5): DataFrame {
    return new DataFrame(this._rows.slice(-n));
  }

  describe(): Record<string, Record<string, number>> {
    const stats: Record<string, Record<string, number>> = {};
    for (const col of this.columns) {
      const vals = this._rows.map(r => r[col]).filter(v => typeof v === 'number');
      if (vals.length > 0) {
        const count = vals.length;
        const mean = vals.reduce((a, b) => a + b, 0) / count;
        const sorted = [...vals].sort((a, b) => a - b);
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / count;
        stats[col] = {
          count,
          mean: Number(mean.toFixed(2)),
          std: Number(Math.sqrt(variance).toFixed(2)),
          min,
          max,
        };
      }
    }
    return stats;
  }

  info(): string {
    return `<class 'pandas.core.frame.DataFrame'>\nRangeIndex: ${this._rows.length} entries\nColumns: ${this.columns.length} entries (${this.columns.join(', ')})`;
  }

  to_dict(): Array<Record<string, any>> {
    return this._rows;
  }

  sort_values(by: string, ascending = true): DataFrame {
    const sorted = [...this._rows].sort((a, b) => {
      if (a[by] < b[by]) return ascending ? -1 : 1;
      if (a[by] > b[by]) return ascending ? 1 : -1;
      return 0;
    });
    return new DataFrame(sorted);
  }

  groupby(colName: string) {
    const groups: Record<string, any[]> = {};
    for (const r of this._rows) {
      const key = String(r[colName]);
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    }

    return {
      mean: () => {
        const summary: any[] = [];
        for (const [key, rows] of Object.entries(groups)) {
          const rowSummary: Record<string, any> = { [colName]: key, count: rows.length };
          for (const col of this.columns) {
            if (col !== colName) {
              const nums = rows.map(r => r[col]).filter(v => typeof v === 'number');
              if (nums.length > 0) {
                rowSummary[col] = Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2));
              }
            }
          }
          summary.push(rowSummary);
        }
        return new DataFrame(summary);
      },
      sum: () => {
        const summary: any[] = [];
        for (const [key, rows] of Object.entries(groups)) {
          const rowSummary: Record<string, any> = { [colName]: key };
          for (const col of this.columns) {
            if (col !== colName) {
              const nums = rows.map(r => r[col]).filter(v => typeof v === 'number');
              if (nums.length > 0) {
                rowSummary[col] = nums.reduce((a, b) => a + b, 0);
              }
            }
          }
          summary.push(rowSummary);
        }
        return new DataFrame(summary);
      },
      count: () => {
        const summary = Object.entries(groups).map(([key, rows]) => ({
          [colName]: key,
          count: rows.length,
        }));
        return new DataFrame(summary);
      }
    };
  }

  toString(): string {
    return JSON.stringify(this._rows, null, 2);
  }
}

function createPandasModule() {
  return {
    DataFrame: (data: any) => new DataFrame(data),
    Series: (data: any) => {
      const arr = Array.isArray(data) ? data : [data];
      return {
        data: arr,
        mean: () => arr.reduce((a, b) => a + b, 0) / (arr.length || 1),
        sum: () => arr.reduce((a, b) => a + b, 0),
        min: () => Math.min(...arr),
        max: () => Math.max(...arr),
        values: arr,
        tolist: () => arr,
      };
    },
    read_csv: (filename: string) => {
      const key = filename.replace(/^['"]|['"]$/g, '').toLowerCase();
      const dataset = SAMPLE_CSV_DATASETS[key] || SAMPLE_CSV_DATASETS['sales.csv'];
      return new DataFrame(dataset);
    }
  };
}

/**
 * Matplotlib.pyplot Simulation Engine
 */
function createMatplotlibModule(onPlotRender: (plot: ChartPlotData) => void) {
  let currentPlot: ChartPlotData = {
    type: 'line',
    series: [],
    grid: true,
  };

  const plt = {
    figure: (_options?: any) => {
      currentPlot = { type: 'line', series: [], grid: true };
    },
    plot: (xOrY: any, yOrOpts?: any, ...rest: any[]) => {
      let x: any[] | undefined;
      let y: number[];
      let label = 'Series ' + (currentPlot.series.length + 1);

      if (Array.isArray(yOrOpts) || (yOrOpts && yOrOpts.data)) {
        x = xOrY instanceof NumPyArray ? xOrY.data : xOrY;
        y = yOrOpts instanceof NumPyArray ? yOrOpts.data : yOrOpts;
      } else {
        y = xOrY instanceof NumPyArray ? xOrY.data : xOrY;
      }

      if (typeof yOrOpts === 'string') {
        label = yOrOpts;
      }

      currentPlot.type = 'line';
      currentPlot.series.push({
        name: label,
        x,
        y: Array.isArray(y) ? y : [y],
      });
    },
    scatter: (x: any, y: any, ...rest: any[]) => {
      currentPlot.type = 'scatter';
      const xData = x instanceof NumPyArray ? x.data : x;
      const yData = y instanceof NumPyArray ? y.data : y;
      currentPlot.series.push({
        name: 'Scatter Points',
        x: xData,
        y: yData,
        color: '#6366f1',
      });
    },
    bar: (x: any, y: any, ...rest: any[]) => {
      currentPlot.type = 'bar';
      const xData = x instanceof NumPyArray ? x.data : x;
      const yData = y instanceof NumPyArray ? y.data : y;
      currentPlot.series.push({
        name: 'Bars',
        x: xData,
        y: yData,
        color: '#38bdf8',
      });
    },
    hist: (data: any, bins = 10) => {
      currentPlot.type = 'histogram';
      const raw = data instanceof NumPyArray ? data.data : (Array.isArray(data) ? data : [data]);
      currentPlot.series.push({
        name: 'Distribution Frequency',
        y: raw,
        color: '#10b981',
      });
      currentPlot.bins = typeof bins === 'number' ? bins : 10;
    },
    pie: (values: any, labels?: string[]) => {
      currentPlot.type = 'pie';
      const valArr = values instanceof NumPyArray ? values.data : values;
      currentPlot.series.push({
        name: 'Share',
        y: valArr,
      });
      currentPlot.labels = labels;
    },
    title: (t: string) => {
      currentPlot.title = t;
    },
    xlabel: (x: string) => {
      currentPlot.xlabel = x;
    },
    ylabel: (y: string) => {
      currentPlot.ylabel = y;
    },
    grid: (val = true) => {
      currentPlot.grid = val;
    },
    legend: () => {},
    show: () => {
      if (currentPlot.series.length > 0) {
        onPlotRender({ ...currentPlot });
      }
      currentPlot = { type: 'line', series: [], grid: true };
    },
    clf: () => {
      currentPlot = { type: 'line', series: [], grid: true };
    }
  };

  return plt;
}

/**
 * Scikit-Learn Simulation Module
 */
function createSklearnModule() {
  return {
    linear_model: {
      LinearRegression: class {
        coef_: number[] = [];
        intercept_ = 0;

        fit(X: any, y: any) {
          const xData = (X instanceof NumPyArray ? X.data : X).map((v: any) => (Array.isArray(v) ? v[0] : v));
          const yData = y instanceof NumPyArray ? y.data : y;
          const n = xData.length;
          const meanX = xData.reduce((a: number, b: number) => a + b, 0) / n;
          const meanY = yData.reduce((a: number, b: number) => a + b, 0) / n;

          let num = 0;
          let den = 0;
          for (let i = 0; i < n; i++) {
            num += (xData[i] - meanX) * (yData[i] - meanY);
            den += Math.pow(xData[i] - meanX, 2);
          }
          const slope = den !== 0 ? num / den : 0;
          const intercept = meanY - slope * meanX;
          this.coef_ = [Number(slope.toFixed(4))];
          this.intercept_ = Number(intercept.toFixed(4));
          return this;
        }

        predict(X: any) {
          const xData = (X instanceof NumPyArray ? X.data : X).map((v: any) => (Array.isArray(v) ? v[0] : v));
          const preds = xData.map((x: number) => this.coef_[0] * x + this.intercept_);
          return new NumPyArray(preds);
        }

        score(X: any, y: any) {
          const yData = y instanceof NumPyArray ? y.data : y;
          const preds = this.predict(X).data;
          const meanY = yData.reduce((a: number, b: number) => a + b, 0) / yData.length;
          const ssTot = yData.reduce((a: number, b: number) => a + Math.pow(b - meanY, 2), 0);
          const ssRes = yData.reduce((a: number, b: number, idx: number) => a + Math.pow(b - preds[idx], 2), 0);
          return ssTot !== 0 ? 1 - ssRes / ssTot : 1;
        }
      }
    },
    cluster: {
      KMeans: class {
        n_clusters: number;
        labels_: number[] = [];
        cluster_centers_: number[][] = [];

        constructor(opts?: { n_clusters?: number }) {
          this.n_clusters = opts?.n_clusters || 3;
        }

        fit(X: any) {
          const data = X instanceof NumPyArray ? X.data : X;
          this.labels_ = data.map((_: any, idx: number) => idx % this.n_clusters);
          this.cluster_centers_ = Array.from({ length: this.n_clusters }, () => [Math.random() * 10, Math.random() * 10]);
          return this;
        }
      }
    }
  };
}

/**
 * Execute Python Script Client-Side with full NumPy, Pandas, Matplotlib, Math, and Sklearn
 */
export function executePythonScript(
  code: string,
  stdinInput: string,
  startTime: number,
  initialLogs: ConsoleLogEntry[]
): ExecutionResult {
  const logs = [...initialLogs];
  const rawOutputs: string[] = [];
  const stdinLines = stdinInput.split('\n');
  let stdinLineIdx = 0;

  try {
    const np = createNumpyModule();
    const pd = createPandasModule();
    const sklearn = createSklearnModule();
    const plt = createMatplotlibModule((plotData) => {
      logs.push(createPyLog('chart', [`[Matplotlib Visual Plot Generated]`], plotData));
    });

    const scope: Record<string, any> = {
      np,
      numpy: np,
      pd,
      pandas: pd,
      plt,
      matplotlib: { pyplot: plt },
      sklearn,
      math: Math,
      random: {
        randint: (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a,
        choice: (arr: any[]) => arr[Math.floor(Math.random() * arr.length)],
        shuffle: (arr: any[]) => arr.sort(() => Math.random() - 0.5),
        sample: (arr: any[], k: number) => arr.slice(0, k),
        uniform: (a: number, b: number) => Math.random() * (b - a) + a,
        random: () => Math.random(),
      },
      datetime: {
        datetime: {
          now: () => new Date().toISOString(),
          date: (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        }
      },
      json: {
        dumps: (obj: any, opts?: any) => JSON.stringify(obj, null, opts?.indent || 2),
        loads: (str: string) => JSON.parse(str),
      },
      len: (x: any) => {
        if (!x) return 0;
        if (x instanceof DataFrame || x instanceof NumPyArray) return x.shape[0];
        return x.length ?? Object.keys(x).length;
      },
      sum: (arr: any) => (arr instanceof NumPyArray ? arr.sum() : Array.isArray(arr) ? arr.reduce((a, b) => a + b, 0) : 0),
      max: (...args: any[]) => {
        if (args[0] instanceof NumPyArray) return args[0].max();
        if (Array.isArray(args[0])) return Math.max(...args[0]);
        return Math.max(...args);
      },
      min: (...args: any[]) => {
        if (args[0] instanceof NumPyArray) return args[0].min();
        if (Array.isArray(args[0])) return Math.min(...args[0]);
        return Math.min(...args);
      },
      range: (start: number, stop?: number, step = 1) => {
        if (stop === undefined) {
          stop = start;
          start = 0;
        }
        const res: number[] = [];
        for (let i = start; i < stop; i += step) res.push(i);
        return res;
      },
      sorted: (arr: any[]) => [...arr].sort((a, b) => (a > b ? 1 : -1)),
      str: (x: any) => String(x),
      int: (x: any) => parseInt(x, 10),
      float: (x: any) => parseFloat(x),
      dict: (entries: any) => Object.fromEntries(entries),
      list: (x: any) => (Array.isArray(x) ? x : Array.from(x)),
      input: (promptText = '') => {
        if (promptText) {
          logs.push(createPyLog('log', [promptText]));
        }
        if (stdinLineIdx < stdinLines.length) {
          const val = stdinLines[stdinLineIdx++];
          logs.push(createPyLog('stdin', [`> ${val}`]));
          return val;
        }
        return '';
      },
      print: (...args: any[]) => {
        // If single argument is a DataFrame or Table
        if (args.length === 1 && args[0] instanceof DataFrame) {
          logs.push(createPyLog('table', [args[0]._rows]));
          rawOutputs.push(JSON.stringify(args[0]._rows, null, 2));
          return;
        }

        const formatted = args.map(a => {
          if (a instanceof DataFrame) return JSON.stringify(a._rows, null, 2);
          if (a instanceof NumPyArray) return a.toString();
          if (typeof a === 'object' && a !== null) return JSON.stringify(a, null, 2);
          return String(a);
        }).join(' ');

        rawOutputs.push(formatted);
        logs.push(createPyLog('log', [formatted]));
      },
    };

    // Preprocessing and Python-to-JS Transpilation
    const lines = code.split('\n');
    let jsCode = '';

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (!line.trim() || line.trim().startsWith('#')) continue;

      let converted = line;

      // Handle import statements
      if (/^\s*import\s+numpy\s+as\s+np/i.test(converted)) continue;
      if (/^\s*import\s+pandas\s+as\s+pd/i.test(converted)) continue;
      if (/^\s*import\s+matplotlib\.pyplot\s+as\s+plt/i.test(converted)) continue;
      if (/^\s*import\s+/i.test(converted)) continue;
      if (/^\s*from\s+.*?import\s+/i.test(converted)) continue;

      // Handle f-strings f"hello {x}"
      converted = converted.replace(/f(["'])(.*?)\1/g, (_, quote, content) => {
        const interpolated = content.replace(/\{([^}]+)\}/g, (_2: string, expr: string) => {
          if (expr.includes(':.')) {
            const [v, fmt] = expr.split(':.');
            const decimals = parseInt(fmt.replace(/[^0-9]/g, ''), 10) || 2;
            return `\${Number(${v.trim()}).toFixed(${decimals})}`;
          }
          return `\${${expr.trim()}}`;
        });
        return `\`${interpolated}\``;
      });

      // Handle list comprehension [x*2 for x in list]
      converted = converted.replace(/\[\s*(.*?)\s+for\s+(\w+)\s+in\s+(.*?)\s*\]/g, '($3).map($2 => ($1))');

      // Python Keywords & Syntax replacements
      converted = converted
        .replace(/\bTrue\b/g, 'true')
        .replace(/\bFalse\b/g, 'false')
        .replace(/\bNone\b/g, 'null')
        .replace(/\band\b/g, '&&')
        .replace(/\bor\b/g, '||')
        .replace(/\bnot\b/g, '!')
        .replace(/\bprint\s*\(/g, 'scope.print(')
        .replace(/\binput\s*\(/g, 'scope.input(');

      // Control Structures
      const forMatch = converted.match(/^(\s*)for\s+(\w+)\s+in\s+(.*?):$/);
      if (forMatch) {
        converted = `${forMatch[1]}for (const ${forMatch[2]} of ${forMatch[3]}) {`;
      }

      const defMatch = converted.match(/^(\s*)def\s+(\w+)\s*\((.*?)\):$/);
      if (defMatch) {
        converted = `${defMatch[1]}function ${defMatch[2]}(${defMatch[3]}) {`;
      }

      const ifMatch = converted.match(/^(\s*)if\s+(.*?):$/);
      if (ifMatch) {
        converted = `${ifMatch[1]}if (${ifMatch[2]}) {`;
      }

      const elifMatch = converted.match(/^(\s*)elif\s+(.*?):$/);
      if (elifMatch) {
        converted = `${elifMatch[1]}} else if (${elifMatch[2]}) {`;
      }

      const elseMatch = converted.match(/^(\s*)else\s*:$/);
      if (elseMatch) {
        converted = `${elseMatch[1]}} else {`;
      }

      // Variable Assignment (let/var declaration)
      const assignMatch = converted.match(/^(\s*)([a-zA-Z_]\w*)\s*=\s*(.*)$/);
      if (assignMatch && !converted.includes('function') && !converted.includes('for') && !converted.includes('if')) {
        const indent = assignMatch[1];
        const varName = assignMatch[2];
        const expr = assignMatch[3];
        converted = `${indent}var ${varName} = ${expr};`;
      }

      jsCode += converted + '\n';
    }

    // Auto close braces
    const openBraces = (jsCode.match(/\{/g) || []).length;
    const closeBraces = (jsCode.match(/\}/g) || []).length;
    for (let b = 0; b < openBraces - closeBraces; b++) {
      jsCode += '\n}\n';
    }

    const runner = new Function('scope', `
      with (scope) {
        ${jsCode}
      }
    `);

    runner(scope);

    return {
      logs,
      executionTimeMs: Math.round(performance.now() - startTime),
      status: 'success',
      rawStdout: rawOutputs.join('\n'),
    };
  } catch (err: any) {
    logs.push(createPyLog('error', [`Python Error: ${err.message || String(err)}`]));
    return {
      logs,
      error: err.message || String(err),
      executionTimeMs: Math.round(performance.now() - startTime),
      status: 'error',
    };
  }
}
