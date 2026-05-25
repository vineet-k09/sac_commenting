import { randomUUID } from "crypto";
import { BigQueryClient } from "../../shared/big-query/bq-client";
import { PROJECT_ID } from "../../..";
import { Comment, CommentLevel } from "./commenting.types";
const DB_NAME = "vfgrp_sac_commenting";
const COMMENT_TABLE = `${PROJECT_ID}.${DB_NAME}.comments`

const bq = new BigQueryClient();

export async function createComment(
    user: string,
    content: string, 
    level: CommentLevel, 
    filter: string
): Promise<Comment>{
    const id = randomUUID();
    const timestamp = new Date().toISOString();

    const query = `
        INSERT INTO ${COMMENT_TABLE}
        (
        id,
        user,
        content,
        level,
        filter,
        CURRENT_TIMESTAMP()
        ) VALUES (
         @id,
         @user,
         @content,
         @level,
         @filter
        )`;

    const queryParams = {
        id,
        user,
        content,
        level,
        filter
    };

    await bq.query(query, queryParams);

    return { id, user, content, filter, level, timestamp };
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

export async function deleteComment(id: string){
    const query = `DELETE FROM ${COMMENT_TABLE} WHERE id = @id`;
    const queryParams = { id };
    const res = await bq.query(query, queryParams);
    return res;
}

export async function putComment(id: string, user: string, content: string, level: CommentLevel, filter: string){
    const query = 
    `UPDATE ${COMMENT_TABLE} 
    SET user = @user, 
    content = @content, 
    level = @level, 
    filter = @filter 
    WHERE id = @id`;
    const queryParams = { id, user, content, level, filter };
    const res = await bq.query(query, queryParams);
    return res;
}