import { BigQueryClient } from "../../shared/big-query/bq-client";
import { PROJECT_ID, DB_NAME } from "../../..";

const getTable = () => {
    return `${PROJECT_ID}.${DB_NAME}.users`;
};

const bq = new BigQueryClient();

export async function getUserRole(email: string) {
    if (!email || !email.trim()) return null;
    const normalizedEmail = email.trim().toLowerCase();
    
    const query = `SELECT role FROM ${getTable()} WHERE email = @email LIMIT 1`;
    const queryParams = { email: normalizedEmail };
    const res = await bq.query<{role: string}>(query, queryParams);
    
    if (res.data && res.data.length > 0 && res.data[0]?.role) {
        return res.data[0].role;
    }

    // User does not exist in BigQuery users table yet.
    // Insert new user as 'Viewer' so admin can review and grant elevated access in BigQuery.
    try {
        const insertQuery = `INSERT INTO ${getTable()} (email, role, created_at) VALUES (@email, 'Viewer', CURRENT_TIMESTAMP())`;
        await bq.query(insertQuery, { email: normalizedEmail });
        console.log(`[Auth Repo] Created new user entry in BigQuery: ${normalizedEmail} (Role: Viewer)`);
    } catch (err) {
        console.error(`[Auth Repo] Failed to auto-insert new user ${normalizedEmail} into BigQuery:`, err);
    }

    return 'Viewer';
}

export async function saveUserRole(email: string, role: string) {
    if (!email || !email.trim()) return { success: false, error: 'Email is required' };
    const normalizedEmail = email.trim().toLowerCase();

    const checkQuery = `SELECT role FROM ${getTable()} WHERE email = @email LIMIT 1`;
    const checkRes = await bq.query<{role: string}>(checkQuery, { email: normalizedEmail });
    const userExists = checkRes.data && checkRes.data.length > 0;
    
    if (userExists) {
        const query = `UPDATE ${getTable()} SET role = @role WHERE email = @email`;
        const queryParams = { email: normalizedEmail, role };
        return await bq.query(query, queryParams);
    } else {
        const query = `INSERT INTO ${getTable()} (email, role, created_at) VALUES (@email, @role, CURRENT_TIMESTAMP())`;
        const queryParams = { email: normalizedEmail, role };
        return await bq.query(query, queryParams);
    }
}
