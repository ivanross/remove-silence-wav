const fs = require('fs');
const path = require('path');
const readline = require('readline');
const wav = require('node-wav');
const fse = require('fs-extra');

// Input and output folder paths
const inputFolder = path.resolve(__dirname, 'input');
const outputFolder = path.resolve(__dirname, 'output');

// Threshold for silence detection (adjust as needed)
const silenceThreshold = 0.01;

// Delete the "output" folder if it exists
if (fs.existsSync(outputFolder)) {
  fse.removeSync(outputFolder);
}

// Read files from the input folder
const inputFiles = fs.readdirSync(inputFolder);

console.log('Processing files...\n');

const totalFiles = inputFiles.length;

function processFile(index) {
  if (index >= totalFiles) {
    console.log('\nAll files processed!');
    return;
  }

  const file = inputFiles[index];
  const inputFilePath = path.join(inputFolder, file);
  const outputFilePath = path.join(outputFolder, file);

  const fileExtension = path.extname(file).toLowerCase();

  if (fileExtension !== '.wav') {
    console.log(`Skipped ${file} (not a WAV file)`);
    processFile(index + 1);
    return;
  }

  try {
    // Load the WAV file
    const inputWavData = fs.readFileSync(inputFilePath);
    const inputWav = wav.decode(inputWavData);

    const { sampleRate, channelData } = inputWav;

    // Find the index of the first non-silent sample
    let startIndex = 0;
    for (let i = 0; i < channelData[0].length; i++) {
      let isSilent = true;
      for (let channel = 0; channel < channelData.length; channel++) {
        if (Math.abs(channelData[channel][i]) > silenceThreshold) {
          isSilent = false;
          break;
        }
      }
      if (!isSilent) {
        startIndex = i;
        break;
      }
    }

    // Create a new WAV object starting from the first non-silent sample
    const newChannelData = channelData.map(channel => channel.subarray(startIndex));
    const newWavData = wav.encode(newChannelData, { sampleRate });

    // Ensure the output folder exists
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder);
    }

    // Write the new WAV data to the output file
    fs.writeFileSync(outputFilePath, newWavData);

    const progressPercentage = ((index + 1) / totalFiles) * 100;
    const progressBarLength = 30;
    const progressBar = Array.from({ length: progressBarLength }, (_, i) =>
      i < (progressPercentage / 100) * progressBarLength ? '=' : ' '
    ).join('');

    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`File: ${file}\n`);
    process.stdout.clearLine();
    process.stdout.write(`[${progressBar}] ${progressPercentage.toFixed(2)}%\n\n`);
  } catch (error) {
    console.error(`Error processing ${file}: ${error.message}`);
  }

  processFile(index + 1);
}

processFile(0);
