package com.codemates.messaging.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SendMessageRequest {

    @NotBlank(message = "Message content cannot be empty")
    private String content;

    /** TEXT, FILE, IMAGE, SYSTEM ... defaults to TEXT if omitted */
    @Size(max = 20)
    private String messageType;

    @Size(max = 500)
    private String fileUrl;

    @Size(max = 255)
    private String fileName;
}
