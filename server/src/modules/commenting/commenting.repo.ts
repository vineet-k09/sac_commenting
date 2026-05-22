import { randomUUID } from "crypto";
import { BigQueryClient } from "../../shared/big-query/bq-client";
import { PROJECT_ID } from "../../..";
import { Comment, CommentType } from "./commenting.types";
const DB_NAME = "vfgrp_sac_commenting";
const COMMENT_TABLE = `${PROJECT_ID}.${DB_NAME}.comments`

const bq = new BigQueryClient();

export async function createComment(user: string, comment: string, filter: string, id?: string, type?: string, timestamp?: string, options?: string[]): Promise<Comment>{
    const idx = id || randomUUID();
    const resolvedType: CommentType = (type || "text") as CommentType;
    const resolvedTimestamp = timestamp || new Date().toISOString();
    const resolvedOptions = options || [];

    const query = `
        INSERT INTO ${COMMENT_TABLE}
        (
        id,
        user,
        comment,
        filter,
        type,
        created_at,
        options
        ) VALUES (
         @id,
         @user,
         @comment,
         @filter,
         @type,
         @timestamp,
         @options
        )`;

    const queryParams = {
        id: idx,
        user,
        comment,
        filter,
        timestamp: resolvedTimestamp,
        type: resolvedType,
        options: resolvedOptions,
    };

    console.log("createComment query:", query, queryParams);

    await bq.query(query, queryParams);

    return { id: idx, user, comment, filter, type: resolvedType, timestamp: resolvedTimestamp, options: resolvedOptions };
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