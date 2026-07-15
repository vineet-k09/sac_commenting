import { BigQueryClient } from "../../shared/big-query/bq-client";

const DB_NAME = "vfgrp_sac_commenting";

const getTable = () => {
    return `${process.env.PROJECT_ID}.${DB_NAME}.users`;
};

const bq = new BigQueryClient();

export async function getUserRole(email: string) {
    const query = `SELECT role FROM ${getTable()} WHERE email = @email LIMIT 1`;
    const queryParams = { email };
    const res = await bq.query<{role: string}>(query, queryParams);
    // Server is the source of truth. If user not in DB, they are a 'Viewer' by default.
    return res.data[0]?.role || 'Viewer';
}

export async function saveUserRole(email: string, role: string) {
    // Check if user exists
    const existingRole = await getUserRole(email);
    
    if (existingRole) {
        const query = `UPDATE ${getTable()} SET role = @role WHERE email = @email`;
        const queryParams = { email, role };
        return await bq.query(query, queryParams);
    } else {
        const query = `INSERT INTO ${getTable()} (email, role, created_at) VALUES (@email, @role, CURRENT_TIMESTAMP())`;
        const queryParams = { email, role };
        return await bq.query(query, queryParams);
    }
}
