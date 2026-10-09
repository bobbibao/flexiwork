declare interface DataServiceInterface {
  /**
   * Processes metadata on resources by spreading metadata properties to the main object
   * @param resource The resource or array of resources to process
   * @returns The processed resource(s) with metadata properties applied
   */
  fillMetadata<T>(resource: T | T[]): T | T[];

  /**
   * Spreads metadata properties of an object to the main object and removes metadata property
   * @param obj The object to process
   */
  spreadObject(obj: any): void;
}

declare const DataService: DataServiceInterface;

export default DataService;
