import * as JSZip from 'jszip';
import { IPayload, LambdaFunction } from './lambda';
import { requireFromString } from './lamool';

export const isNode = (typeof process !== "undefined" && typeof require !== "undefined");

export const zipToFunc = async <T = IPayload, U = T>(zipFile: Buffer | Blob, fileName: string, handlerName: string): Promise<LambdaFunction<T, U>> => {
  const zip = await JSZip.loadAsync(zipFile);
  const file = await zip.file(fileName);

  if (!file) {
    throw new Error('handler file not found: ' + fileName);
  }

  const funcStr = await file.async('text');
  const moduleObject = requireFromString(funcStr);
  const handlerFunc = moduleObject[handlerName];
  if (!handlerFunc) {
    throw new Error('handler not found: ' + handlerName + '\n' + moduleObject);

  }
  return handlerFunc;
};

export const funcToZip = <T = IPayload, U = T>(func: LambdaFunction<T, U>, fileName = 'index.js', handlerName = 'handler') => {
  const zip = new JSZip();
  zip.file(fileName, funcToModule(func, handlerName));

  const zipType = isNode ? 'nodebuffer' : 'blob';

  return new Promise((resolve, _reject) => {
    zip.generateAsync({type: zipType}).then((content) => {
      resolve(content);
    });
  });
};

const funcToModule = <T, U>(func: LambdaFunction<T, U>, handlerName = 'handler') => {
  return `module.exports.${handlerName} = ${func.toString()}`;
};
