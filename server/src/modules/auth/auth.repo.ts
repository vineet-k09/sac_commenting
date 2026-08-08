import { BigQueryClient } from "../../shared/big-query/bq-client";
import { PROJECT_ID, DB_NAME } from "../../..";

const getTable = () => {
    return `${PROJECT_ID}.${DB_NAME}.users`;
};

const bq = new BigQueryClient();

export async function getUserRole(email: string) {
    const query = `SELECT role FROM ${getTable()} WHERE email = @email LIMIT 1`;
    const queryParams = { email };
    const res = await bq.query<{role: string}>(query, queryParams);
    return res.data[0]?.role || null;
}

export async function saveUserRole(email: string, role: string) {
    // Check if user already exists in users table
    const checkQuery = `SELECT role FROM ${getTable()} WHERE email = @email LIMIT 1`;
    const checkRes = await bq.query<{role: string}>(checkQuery, { email });
    const userExists = checkRes.data && checkRes.data.length > 0;
    
    if (userExists) {
        const query = `UPDATE ${getTable()} SET role = @role WHERE email = @email`;
        const queryParams = { email, role };
        return await bq.query(query, queryParams);
    } else {
        const query = `INSERT INTO ${getTable()} (email, role, created_at) VALUES (@email, @role, CURRENT_TIMESTAMP())`;
        const queryParams = { email, role };
        return await bq.query(query, queryParams);
    }
}
