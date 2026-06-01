import { randomUUID } from "crypto";
import { BigQueryClient } from "../../shared/big-query/bq-client";
import { CommentLevel } from "./commenting.types";
const DB_NAME = "vfgrp_sac_commenting";

const getTable = () => {
    return `${process.env.PROJECT_ID}.${DB_NAME}.comments`;
};

const bq = new BigQueryClient();

export async function createComment(
    user: string,
    content: string, 
    level: CommentLevel, 
    filter: string
){
    const id = randomUUID();

    const query = `
        INSERT INTO ${getTable()}
        (
        id,
        user,
        content,
        level,
        filter,
        created_at
        ) VALUES (
         @id,
         @user,
         @content,
         @level,
         @filter,
         CURRENT_TIMESTAMP()
        )`;

    const queryParams = {
        id,
        user,
        content,
        level,
        filter
    };

    const res = await bq.query(query, queryParams);

    return res;
}

export async function getComments(filter?: string){
    let query = `SELECT * FROM ${getTable()}`;
    if (filter) {
        query += ` WHERE filter = @filter`;
    }
    query += ` ORDER BY created_at DESC LIMIT 1000`;
    const results = await bq.query(query, filter ? { filter } : undefined);
    return results.data;
}

export async function deleteComment(id: string){
    const query = `DELETE FROM ${getTable()} WHERE id = @id`;
    const queryParams = { id };
    const res = await bq.query(query, queryParams);
    return res;
}

export async function putComment(id: string, user: string, content: string, level: CommentLevel, filter: string, username: string){
    const query = 
    `UPDATE ${getTable()} 
    SET user = @user, 
    content = @content, 
    level = @level, 
    filter = @filter,
    modified_by = @username,
    modified_at = CURRENT_TIMESTAMP() 
    WHERE id = @id`;
    const queryParams = { id, user, content, level, filter, username};
    const res = await bq.query(query, queryParams);
    return res;
}