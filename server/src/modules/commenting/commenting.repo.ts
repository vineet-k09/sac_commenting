import { randomUUID } from "crypto";
import { BigQueryClient } from "../../shared/big-query/bq-client";
import { PROJECT_ID } from "../../..";

const DB_NAME = "vfgrp_sac_commenting";
const COMMENT_TABLE = `${PROJECT_ID}.${DB_NAME}.comments`

const bq = new BigQueryClient();

export async function createComment(user: string, comment: string, filter: string){
    const id = randomUUID();

    await bq.query(`
        INSERT INTO ${COMMENT_TABLE}
        (
        id,
        user,
        comment,
        filter,
        created_at,
        ) VALUES (
         @id,
         @user,
         @comment,
         @filter,
         CURRENT_TIMESTAMP()
        )`, 
        {
            id,
            user,
            comment,
            filter
        }
    );

    return { id };
}

export async function getComments(filter?: string){
    let query = `SELECT * FROM ${COMMENT_TABLE}`;
    if (filter) {
        query += ` WHERE filter = @filter`;
    }
    query += ` ORDER BY created_at DESC LIMIT 1000`;
    const results = await bq.query(query, filter ? { filter } : undefined);
    return results.data;
}