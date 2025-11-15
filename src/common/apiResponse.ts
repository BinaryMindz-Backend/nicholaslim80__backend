/* eslint-disable @typescript-eslint/no-unsafe-assignment */
export class ApiResponses {
  /**
   * Success response
   * @param data - any data to return
   * @param message - optional success message
   */
  static success<T>(data: T, message = 'Success') {
    return {
      success: true,
      message,
      data,
    } as const;
  }

  /**
   * Error response
   * @param error - optional error details
   * @param message - optional error message
   */
  static error(error: any = null, message = 'Something went wrong') {
    return {
      success: false,
      message,
      error,
    } as const;
  }
}
