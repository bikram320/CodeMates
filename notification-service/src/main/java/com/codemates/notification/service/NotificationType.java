package com.codemates.notification.service;

/**
 * Notification.type is a plain varchar (same pattern as Task.status/priority in
 * project-service) - these constants are the enforced set of valid values, used
 * only within this service, not a DB enum.
 */
public final class NotificationType {
    public static final String WELCOME = "WELCOME";
    public static final String PROJECT_CREATED = "PROJECT_CREATED";
    public static final String PROJECT_INVITATION = "PROJECT_INVITATION";
    public static final String PROJECT_MEMBER_JOINED = "PROJECT_MEMBER_JOINED";
    public static final String PROJECT_MEMBER_REMOVED = "PROJECT_MEMBER_REMOVED";
    public static final String TASK_CREATED = "TASK_CREATED";
    public static final String TASK_ASSIGNED = "TASK_ASSIGNED";
    public static final String TASK_STATUS_CHANGED = "TASK_STATUS_CHANGED";
    public static final String TASK_COMPLETED = "TASK_COMPLETED";
    public static final String MESSAGE_RECEIVED = "MESSAGE_RECEIVED";
    public static final String GITHUB_SYNC_COMPLETED = "GITHUB_SYNC_COMPLETED";

    private NotificationType() {}
}
