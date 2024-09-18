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
  // 'file_example_mp3_700kb.mp3',
  // 'file_example_mp3_1mg.mp3',
  // 'file_example_mp3_12s.mp3',
  // 'file_example_mp3_15s.mp3',
  // 'airy_vocal_ambient_174820.mp3',
  // 'rise_and_shine_203779.mp3',
  // 'sample_3s.mp3',
  // 'sample_6s.mp3',
  // 'sample_9s.mp3',
  // 'test1.mp3',
  // 'test2.mp3',
  // 'test3.mp3',
  // 'sample.m4a',
  'amigo_corno_227859.mp3',
  'city_stress_219957.mp3',
  'dancing_in_the_stars_219514.mp3',
  'dreams_of_stardust_p1_237662.mp3',
  'first_light_239806.mp3',
  'ketpow_the_girl_201275.mp3',
  // 'lac_buoc_jonagr_240333.mp3',
  // 'lo_fi_vocal_soft_my_love_115603.mp3',
  // 'motivacao_237993.mp3',
  // 'original_song_239607.mp3',
  // 'voices_are_calling_atmospheric_ambient_with_vocal_225458.mp3',
  // 'whiskey_roads_and_dusty_dreams_1_225935.mp3',
];

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
