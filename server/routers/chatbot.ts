import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { createChatbotConversation, getChatbotConversation, updateChatbotConversation } from "../db";
import { invokeLLM } from "../_core/llm";
import { nanoid } from "nanoid";

export const chatbotRouter = router({
  startConversation: publicProcedure
    .input(z.object({
      visitorId: z.string().optional(),
      visitorEmail: z.string().email().optional(),
      visitorName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const visitorId = input.visitorId || nanoid();
      
      await createChatbotConversation({
        visitorId,
        visitorEmail: input.visitorEmail || null,
        visitorName: input.visitorName || null,
        messages: JSON.stringify([]),
        status: "active",
      });
      
      return { visitorId };
    }),

  sendMessage: publicProcedure
    .input(z.object({
      visitorId: z.string(),
      message: z.string(),
    }))
    .mutation(async ({ input }) => {
      const conversation = await getChatbotConversation(input.visitorId);
      let messages: any[] = [];
      
      if (conversation && conversation.messages) {
        try {
          messages = JSON.parse(conversation.messages);
        } catch {
          messages = [];
        }
      }
      
      // Adicionar mensagem do visitante
      messages.push({
        role: "user",
        content: input.message,
        timestamp: new Date(),
      });
      
      // Gerar resposta com LLM
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are a helpful customer support assistant for SVS Soluções, a technology solutions company. Be professional, friendly, and helpful. Respond in Portuguese.",
            },
            ...messages.map(m => ({
              role: m.role,
              content: m.content,
            })),
          ],
        });
        
        const assistantMessage = response.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua mensagem.";
        
        messages.push({
          role: "assistant",
          content: assistantMessage,
          timestamp: new Date(),
        });
        
        // Atualizar conversa
        await updateChatbotConversation(input.visitorId, messages);
        
        return {
          visitorId: input.visitorId,
          response: assistantMessage,
          messageCount: messages.length,
        };
      } catch (error) {
        console.error("Error generating chatbot response:", error);
        
        const errorMessage = "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.";
        messages.push({
          role: "assistant",
          content: errorMessage,
          timestamp: new Date(),
        });
        
        await updateChatbotConversation(input.visitorId, messages);
        
        return {
          visitorId: input.visitorId,
          response: errorMessage,
          messageCount: messages.length,
          error: true,
        };
      }
    }),

  getConversation: publicProcedure
    .input(z.object({ visitorId: z.string() }))
    .query(async ({ input }) => {
      const conversation = await getChatbotConversation(input.visitorId);
      
      if (!conversation) {
        return null;
      }
      
      let messages: any[] = [];
      try {
        if (conversation.messages) {
          messages = JSON.parse(conversation.messages);
        }
      } catch {
        messages = [];
      }
      
      return {
        visitorId: conversation.visitorId || input.visitorId,
        visitorName: conversation.visitorName || undefined,
        visitorEmail: conversation.visitorEmail || undefined,
        messages,
        status: conversation.status,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };
    }),
});
