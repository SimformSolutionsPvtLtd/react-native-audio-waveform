import fs from 'react-native-fs';
import RNFetchBlob from 'rn-fetch-blob';
import { globalMetrics } from '../../src/theme';

export interface ListItem {
  fromCurrentUser: boolean;
  path: string;
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
 * @returns {Promise<void>} A Promise that resolves when the file is copied.
 */
const copyFile = async (
  value: string,
  destinationPath: string
): Promise<void> => {
  const fileExists = await fs.exists(`${destinationPath}/${value}`);

  if (!fileExists) {
    try {
      const file = await fs.readFileRes(`raw/${value}`, 'base64');
      await fs.writeFile(`${destinationPath}/${value}`, file, 'base64');
    } catch (error) {
      console.error(error);
    }
  }
};

/**
 * Copy all files in the 'audioAssetArray' to the destination path (Android only).
 * @returns {Promise<void>} A Promise that resolves when all files are copied.
 */
const copyFilesToAndroidResources = async (): Promise<void> => {
  if (globalMetrics.isAndroid) {
    await Promise.all(audioAssetArray.map(value => copyFile(value, filePath)));
  }
};

const audioAssetArray = [
  'file_example_mp3_700kb.mp3',
  'file_example_mp3_1mg.mp3',
  'file_example_mp3_12s.mp3',
  'file_example_mp3_15s.mp3',
];

copyFilesToAndroidResources();

/**
 * List of file objects with information about the files.
 * @type {ListItem[]}
 */
export const audioListArray: ListItem[] = audioAssetArray.map(
  (value, index) => ({
    fromCurrentUser: index % 2 !== 0,
    path: `${filePath}/${value}`,
  })
);
