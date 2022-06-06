import { TypedBuffer } from './TypedBuffer'

/**
 * <h1> DataType </h1>
 * Describes the transformers for the data type.
 */
export abstract class DataType<T = never> {
  /**
   * Reads a value of the specified type from the byte array.
   * Returns tuple with the value and the number of bytes read.
   * @param buffer - Buffer to read from.
   * @param offset - Offset to start reading from.
   * @return {[T, number]} - Tuple with the value and the number of bytes read.
   */
  abstract read(buffer: TypedBuffer, offset: number): [T, number]

  /**
   * Writes a value of the specified type and returns new buffer length.
   * @param buffer - Buffer to write to.
   * @param value - Value to write.
   * @returns {number} - how many bytes were written.
   */
  abstract write(buffer: TypedBuffer, value: T): number
}

/**
 * Constructor for the {@link DataType}
 */
export interface DataTypeConstructor<T> {
  new(): DataType<T>
}

/**
 * Describes transformer type for decorators
 */
export type DataTypeTransformer<T> = DataTypeConstructor<T> | DataType<T>
/**
 * Creates new transformer from DataTypeTransformer
 * @param transformer
 * @constructor
 */
export const NewTransformer = <T>(transformer: DataTypeTransformer<T>) => transformer instanceof DataType ? transformer : new transformer()
