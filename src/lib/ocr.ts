import { createWorker } from 'tesseract.js';

let workerInstance: Awaited<ReturnType<typeof createWorker>> | null = null;

async function getWorker() {
  if (!workerInstance) {
    workerInstance = await createWorker('jpn');
  }
  return workerInstance;
}

export async function recognizeImage(
  image: File | Blob,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const worker = await getWorker();

  if (onProgress) {
    // Tesseract.js v5 doesn't support granular progress in recognize,
    // but we can signal start/end
    onProgress(0.1);
  }

  const { data } = await worker.recognize(image);

  if (onProgress) {
    onProgress(1);
  }

  return data.text;
}

export async function terminateWorker() {
  if (workerInstance) {
    await workerInstance.terminate();
    workerInstance = null;
  }
}
