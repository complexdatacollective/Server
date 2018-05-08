#!/usr/bin/env node
const icongen = require('icon-gen');
const fs = require('fs');
const path = require('path');
const svg2png = require('svg2png');

const jobList = [
  // {
  //   name: 'Electron Main App Icon',
  //   runner: 'icongen',
  //   inputFile: 'assets/icons/Srv-Desktop.svg',
  //   outputPath: 'build-resources',
  //   options: {
  //     modes: ['ico', 'icns'], // all
  //     names: {
  //       ico: 'icon',
  //       icns: 'icon',
  //     },
  //     report: true,
  //   },
  // },
  {
    name: 'Electron Tray Icon',
    runner: 'svg2png',
    inputFile: 'assets/icons/Srv-Tray.svg',
    outputPath: 'public/icons/',
    sizes: [16, 32],
    fileName: 'trayTemplate',
    append: ['', '@2x'],
  },
];

const icongenTask = (specification) => {
  console.log('icon-gen task');
  console.log(specification);
  icongen(specification.inputFile, specification.outputPath, specification.options)
    .then((results) => {
      console.log(results);
    })
    .catch((err) => {
      console.log(err);
    });
};

const svg2pngTask = (specification) => {
  console.log('SVG2PNG task');
  console.log(specification);
  const buffer = fs.readFileSync(specification.inputFile);

  if (!buffer) {
    throw Error(`Failed to write the image ${specification.size} x ${specification.size}`);
  }

  Object.entries(specification.sizes).forEach((size) => {
    console.log(`size ${size[1]}`);
    let dest = `${specification.fileName}${specification.append[specification.sizes.indexOf(size[1])]}.png`;
    dest = path.join(specification.outputPath + dest);
    console.log(`dest ${dest}`);

    svg2png(buffer, { width: size[1], height: size[1] }).then((output) => {
      fs.writeFile(dest, output, (err) => {
        console.log(err);
      });
    });
  });
};

const parseJobs = (jobs) => {
  Object.entries(jobs).forEach((job) => {
    if (job[1].runner === 'icongen') {
      icongenTask(job[1]);
    } else {
      svg2pngTask(job[1]);
    }
  });
};

parseJobs(jobList);
