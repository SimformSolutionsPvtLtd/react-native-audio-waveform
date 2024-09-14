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
 * @returns {Promise<boolean>} A Promise that resolves to true if the file is copied successfully, otherwise false.
 */
const copyFile = async (
  path: string,
  value: string,
  destinationPath: string
): Promise<boolean> => {
  const fileDestinationPath = `${destinationPath}/${value}`;
  const valueFilePath = `${path}/${value}`;

  const fileAlreadyCopied = await fs.exists(fileDestinationPath);

  if (!fileAlreadyCopied) {
    try {
      const valueFileExists = await fs.exists(valueFilePath);
      if (!valueFileExists)
        throw new Error(`File ${valueFilePath} does not exist`);

      await fs.copyFile(valueFilePath, fileDestinationPath);
      return true;
    } catch (error) {
      console.error(
        `Error copying file from ${valueFilePath} to ${destinationPath}`,
        error
      );
      return false;
    }
  }

  return true; // File already exists
};

const audioAssetArray = [
  'file_example_mp3_700kb.mp3',
  'file_example_mp3_1mg.mp3',
  'file_example_mp3_12s.mp3',
  'file_example_mp3_15s.mp3',
];

/**
 * Copy all files in the 'audioAssetArray' to the destination path (Android only), or return all files (iOS).
 * @returns {Promise<string[]>} A Promise that resolves to a list of successfully copied file paths.
 */
const copyFilesToNativeResources = async (): Promise<string[]> => {
  if (globalMetrics.isAndroid) {
    const successfulCopies = await Promise.all(
      audioAssetArray.map(async value => {
        const isSuccess = await copyFile(
          fs.ExternalCachesDirectoryPath,
          value,
          filePath
        );
        return isSuccess ? value : null;
      })
    );

    // Filter out unsuccessful file copies
    return successfulCopies?.filter?.(value => value !== null);
  }

  // On iOS, return all files without copying
  return audioAssetArray;
};

/**
 * Generate a list of file objects with information about successfully copied files (Android)
 * or all files (iOS).
 * @returns {Promise<ListItem[]>} A Promise that resolves to the list of file objects.
 */
export const generateAudioList = async (): Promise<ListItem[]> => {
  const audioAssets = await copyFilesToNativeResources();

  // Generate the final list based on the copied or available files
  return audioAssets?.map?.((value, index) => ({
    fromCurrentUser: index % 2 !== 0,
    path: `${filePath}/${value}`,
  }));
};
