export class ApiResponses {
 
  static success<T>(data: T, message = 'Success') {
    return {
      success: true,
      message,
      data,
    } as const;
  }
 
  static error(error: any = null, message = 'Something went wrong') {
    return {
      success: false,
      message,
      error,
    } as const;
  }
}
