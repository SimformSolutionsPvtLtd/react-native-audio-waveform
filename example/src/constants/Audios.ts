import fs from 'react-native-fs';
import RNFetchBlob from 'rn-fetch-blob';
import { globalMetrics } from '../../src/theme';

export interface ListItem {
  fromCurrentUser: boolean;
  path: string;
  isExternalUrl?: boolean;
}

/**
 * File path based on the platform.
 * @type {string}
 */
const filePath: string = globalMetrics.isAndroid
  ? RNFetchBlob.fs.dirs.CacheDir
  : RNFetchBlob.fs.dirs.MainBundleDir;

/**
 * Copy a file to the specified destination path if it doesn't exist.
 * @param {string} value - The name of the file to copy.
 * @param {string} destinationPath - The destination path to copy the file to.
 * @returns {Promise<boolean>} A Promise that resolves to true if the file is copied successfully, otherwise false.
 */
const copyFile = async (
  value: string,
  destinationPath: string
): Promise<boolean> => {
  const fileExists = await fs.exists(`${destinationPath}/${value}`);

  if (!fileExists) {
    try {
      const file = await fs.readFileRes(`raw/${value}`, 'base64');
      await fs.writeFile(`${destinationPath}/${value}`, file, 'base64');
      return true;
    } catch (error) {
      console.error(`Error copying file ${value}: `, error);
      return false;
    }
  }

  return true; // File already exists
};

/**
 * Copy all files in the 'audioAssetArray' to the destination path (Android only), or return all files (iOS).
 * @returns {Promise<string[]>} A Promise that resolves to a list of successfully copied file paths.
 */
const copyFilesToNativeResources = async (): Promise<string[]> => {
  if (globalMetrics.isAndroid) {
    const successfulCopies = await Promise.all(
      audioAssetArray.map(async value => {
        const isSuccess = await copyFile(value, filePath);
        return isSuccess ? value : null;
      })
    );

    // Filter out unsuccessful file copies
    return successfulCopies?.filter?.(value => value !== null);
  }

  // On iOS, return all files without copying
  return audioAssetArray;
};

const audioAssetArray = [
  'file_example_mp3_700kb.mp3',
  'file_example_mp3_1mg.mp3',
  'file_example_mp3_12s.mp3',
  'file_example_mp3_15s.mp3',
];

const externalAudioAssetArray = [
  'https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/theme_01.mp3',
  'https://codeskulptor-demos.commondatastorage.googleapis.com/pang/paza-moduless.mp3',
];

/**
 * Generate a list of file objects with information about successfully copied files (Android)
 * or all files (iOS).
 * @returns {Promise<ListItem[]>} A Promise that resolves to the list of file objects.
 */
export const generateAudioList = async (): Promise<ListItem[]> => {
  const audioAssets = await copyFilesToNativeResources();

  // Generate the final list based on the copied or available files
  const localAssetList = audioAssets?.map?.((value, index) => ({
    fromCurrentUser: index % 2 !== 0,
    path: `${filePath}/${value}`,
  }));

  const externalAudioList: ListItem[] = externalAudioAssetArray.map(
    (value, index) => ({
      fromCurrentUser: index % 2 !== 0,
      path: value,
      isExternalUrl: true,
    })
  );

  return [...localAssetList, ...externalAudioList];
};
