import { BigQuery } from "@google-cloud/bigquery";

export interface QueryResult<T = unknown> {
  success: boolean;
  data: T[];
  error?: string;
  executionTime?: string;
}

export class BigQueryClient { // stateful
  private readonly bigquery: InstanceType<typeof BigQuery>;
  private readonly resolvedLocation: string;

  constructor(
    private readonly projectId?: string,
    private readonly keyFilename?: string,
    private readonly location?: string,
  ) {

    //  Build options object dynamically to avoid TS errors
    const options: any = {};

    // passing the key_file was causing error because the creds were expired. 
    // updated to only pass the default values 
    const resolvedProjectId = this.projectId || process.env.PROJECT_ID;
    const resolvedKeyFilename = this.keyFilename;
    this.resolvedLocation = this.location || process.env.BQ_LOCATION || 'europe-west3';
    // const resolvedKeyFilename = this.keyFilename || KEY_FILE;

    if (resolvedProjectId) options.projectId = resolvedProjectId;
    if (resolvedKeyFilename) options.keyFilename = resolvedKeyFilename;
    if (this.resolvedLocation) options.location = this.resolvedLocation;

    this.bigquery = new BigQuery(options);

    // Optional: test connection
    this.bigquery.getDatasets() // client(*) ->(**) server ->(1*) -> bigquery SSE (10 mil, 10 mil statefull)
      .then(() => console.log("Connected to BigQuery"))
      .catch(err => console.error(" BigQuery connection failed:", err));
  }

  async query<T = unknown>(
    query: string,
    params?: Record<string, unknown> | unknown[],
  ): Promise<QueryResult<T>> {
    const start = performance.now();
    console.log("➡ Running BigQuery query...");

    try {
      let result;

      if (params !== undefined) {
        result = await this.bigquery.query({ query, params, location: this.resolvedLocation });
      } else {
        result = await this.bigquery.query({ query, location: this.resolvedLocation });
      }

      const [rows] = result;

      return {
        success: true,
        data: rows as T[],
        executionTime: `${(performance.now() - start).toFixed(2)}ms`,
      };
    } catch (error: any) {
      console.error(" Query failed:", error);
      return {
        success: false,
        data: [],
        error: error.message,
      };
    }
  }

  async insert(
    dataset: string,
    table: string,
    rows: object[],
  ): Promise<QueryResult> {
    const start = performance.now();

    try {
      await this.bigquery.dataset(dataset).table(table).insert(rows);

      return {
        success: true,
        data: [],
        executionTime: `${(performance.now() - start).toFixed(2)}ms`,
      };
    } catch (error: any) {
      console.error(" Insert failed:", error);
      return {
        success: false,
        data: [],
        error: error.message,
      };
    }
  }
}