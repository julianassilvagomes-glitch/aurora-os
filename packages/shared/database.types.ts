export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audiencia: {
        Row: {
          data_hora: string
          id: string
          local_ou_link: string | null
          observacoes_pos: string | null
          processo_id: string
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          data_hora: string
          id?: string
          local_ou_link?: string | null
          observacoes_pos?: string | null
          processo_id: string
          status?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          data_hora?: string
          id?: string
          local_ou_link?: string | null
          observacoes_pos?: string | null
          processo_id?: string
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audiencia_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processo"
            referencedColumns: ["id"]
          },
        ]
      }
      bloco_cronograma: {
        Row: {
          bloco_origem_id: string | null
          categoria: Database["public"]["Enums"]["categoria_estudo"]
          data: string
          disciplina_id: string
          duracao_planejada_min: number
          id: string
          motivo_realocacao: string | null
          status: string
          topico_id: string | null
        }
        Insert: {
          bloco_origem_id?: string | null
          categoria: Database["public"]["Enums"]["categoria_estudo"]
          data: string
          disciplina_id: string
          duracao_planejada_min: number
          id?: string
          motivo_realocacao?: string | null
          status?: string
          topico_id?: string | null
        }
        Update: {
          bloco_origem_id?: string | null
          categoria?: Database["public"]["Enums"]["categoria_estudo"]
          data?: string
          disciplina_id?: string
          duracao_planejada_min?: number
          id?: string
          motivo_realocacao?: string | null
          status?: string
          topico_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bloco_cronograma_bloco_origem_id_fkey"
            columns: ["bloco_origem_id"]
            isOneToOne: false
            referencedRelation: "bloco_cronograma"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloco_cronograma_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplina"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloco_cronograma_topico_id_fkey"
            columns: ["topico_id"]
            isOneToOne: false
            referencedRelation: "topico_edital"
            referencedColumns: ["id"]
          },
        ]
      }
      bloco_tempo: {
        Row: {
          bloco_origem_realocacao_id: string | null
          criado_por: string
          data: string
          entidade_origem_id: string | null
          hora_fim: string
          hora_inicio: string
          id: string
          status: Database["public"]["Enums"]["status_bloco"]
          tipo_origem: Database["public"]["Enums"]["tipo_origem_bloco"]
          titulo: string
        }
        Insert: {
          bloco_origem_realocacao_id?: string | null
          criado_por: string
          data: string
          entidade_origem_id?: string | null
          hora_fim: string
          hora_inicio: string
          id?: string
          status?: Database["public"]["Enums"]["status_bloco"]
          tipo_origem: Database["public"]["Enums"]["tipo_origem_bloco"]
          titulo: string
        }
        Update: {
          bloco_origem_realocacao_id?: string | null
          criado_por?: string
          data?: string
          entidade_origem_id?: string | null
          hora_fim?: string
          hora_inicio?: string
          id?: string
          status?: Database["public"]["Enums"]["status_bloco"]
          tipo_origem?: Database["public"]["Enums"]["tipo_origem_bloco"]
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "bloco_tempo_bloco_origem_realocacao_id_fkey"
            columns: ["bloco_origem_realocacao_id"]
            isOneToOne: false
            referencedRelation: "bloco_tempo"
            referencedColumns: ["id"]
          },
        ]
      }
      categoria_financeira: {
        Row: {
          ativa: boolean
          grupo: string
          id: string
          nome: string
        }
        Insert: {
          ativa?: boolean
          grupo: string
          id?: string
          nome: string
        }
        Update: {
          ativa?: boolean
          grupo?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      checklist_fechamento: {
        Row: {
          aprovado: boolean
          data_fechamento: string | null
          id: string
          itens: Json
          processo_id: string
        }
        Insert: {
          aprovado?: boolean
          data_fechamento?: string | null
          id?: string
          itens?: Json
          processo_id: string
        }
        Update: {
          aprovado?: boolean
          data_fechamento?: string | null
          id?: string
          itens?: Json
          processo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_fechamento_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processo"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracao_notificacao: {
        Row: {
          antecedencia: string | null
          ativo: boolean
          id: string
          tipo_alerta: string
        }
        Insert: {
          antecedencia?: string | null
          ativo?: boolean
          id?: string
          tipo_alerta: string
        }
        Update: {
          antecedencia?: string | null
          ativo?: boolean
          id?: string
          tipo_alerta?: string
        }
        Relationships: []
      }
      conflito_agenda: {
        Row: {
          bloco_a_id: string
          bloco_b_id: string
          data_detectado: string
          id: string
          resolvido: boolean
        }
        Insert: {
          bloco_a_id: string
          bloco_b_id: string
          data_detectado?: string
          id?: string
          resolvido?: boolean
        }
        Update: {
          bloco_a_id?: string
          bloco_b_id?: string
          data_detectado?: string
          id?: string
          resolvido?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "conflito_agenda_bloco_a_id_fkey"
            columns: ["bloco_a_id"]
            isOneToOne: false
            referencedRelation: "bloco_tempo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conflito_agenda_bloco_b_id_fkey"
            columns: ["bloco_b_id"]
            isOneToOne: false
            referencedRelation: "bloco_tempo"
            referencedColumns: ["id"]
          },
        ]
      }
      conflito_sincronizacao: {
        Row: {
          data_detectado: string
          entidade: string
          entidade_id: string
          id: string
          origem_a: string | null
          origem_b: string | null
          resolvido: boolean
          resolvido_em: string | null
          versao_dispositivo_a: Json
          versao_dispositivo_b: Json
          versao_final: Json | null
        }
        Insert: {
          data_detectado?: string
          entidade: string
          entidade_id: string
          id?: string
          origem_a?: string | null
          origem_b?: string | null
          resolvido?: boolean
          resolvido_em?: string | null
          versao_dispositivo_a: Json
          versao_dispositivo_b: Json
          versao_final?: Json | null
        }
        Update: {
          data_detectado?: string
          entidade?: string
          entidade_id?: string
          id?: string
          origem_a?: string | null
          origem_b?: string | null
          resolvido?: boolean
          resolvido_em?: string | null
          versao_dispositivo_a?: Json
          versao_dispositivo_b?: Json
          versao_final?: Json | null
        }
        Relationships: []
      }
      consulta_exame: {
        Row: {
          data_hora: string
          especialidade_ou_nome: string
          id: string
          local: string | null
          observacoes: string | null
          resultado_arquivo_id: string | null
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          data_hora: string
          especialidade_ou_nome: string
          id?: string
          local?: string | null
          observacoes?: string | null
          resultado_arquivo_id?: string | null
          status?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          data_hora?: string
          especialidade_ou_nome?: string
          id?: string
          local?: string | null
          observacoes?: string | null
          resultado_arquivo_id?: string | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consulta_exame_resultado_arquivo_id_fkey"
            columns: ["resultado_arquivo_id"]
            isOneToOne: false
            referencedRelation: "documento"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplina: {
        Row: {
          area: string
          ativa: boolean
          id: string
          nome: string
          ordem_no_ciclo: number
          peso_no_edital: number | null
        }
        Insert: {
          area: string
          ativa?: boolean
          id?: string
          nome: string
          ordem_no_ciclo: number
          peso_no_edital?: number | null
        }
        Update: {
          area?: string
          ativa?: boolean
          id?: string
          nome?: string
          ordem_no_ciclo?: number
          peso_no_edital?: number | null
        }
        Relationships: []
      }
      documento: {
        Row: {
          caminho_armazenamento: string
          data_importacao: string
          id: string
          nome: string
          tipo_arquivo: string | null
        }
        Insert: {
          caminho_armazenamento: string
          data_importacao?: string
          id?: string
          nome: string
          tipo_arquivo?: string | null
        }
        Update: {
          caminho_armazenamento?: string
          data_importacao?: string
          id?: string
          nome?: string
          tipo_arquivo?: string | null
        }
        Relationships: []
      }
      documento_pdf: {
        Row: {
          arquivo_ref: string
          data_importacao: string
          id: string
          paginas_relevantes: string | null
          tipo: string
          titulo: string
          topico_id: string | null
        }
        Insert: {
          arquivo_ref: string
          data_importacao?: string
          id?: string
          paginas_relevantes?: string | null
          tipo: string
          titulo: string
          topico_id?: string | null
        }
        Update: {
          arquivo_ref?: string
          data_importacao?: string
          id?: string
          paginas_relevantes?: string | null
          tipo?: string
          titulo?: string
          topico_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documento_pdf_arquivo_ref_fkey"
            columns: ["arquivo_ref"]
            isOneToOne: false
            referencedRelation: "documento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documento_pdf_topico_id_fkey"
            columns: ["topico_id"]
            isOneToOne: false
            referencedRelation: "topico_edital"
            referencedColumns: ["id"]
          },
        ]
      }
      documento_processual: {
        Row: {
          descricao: string | null
          id: string
          identificador_num: string
          pagina: string | null
          processo_id: string
          tipo: string
        }
        Insert: {
          descricao?: string | null
          id?: string
          identificador_num: string
          pagina?: string | null
          processo_id: string
          tipo: string
        }
        Update: {
          descricao?: string | null
          id?: string
          identificador_num?: string
          pagina?: string | null
          processo_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "documento_processual_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processo"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_recorrente: {
        Row: {
          ativa: boolean
          gera_blocos_ate: string | null
          id: string
          regra_recorrencia: string
          titulo_modelo: string
        }
        Insert: {
          ativa?: boolean
          gera_blocos_ate?: string | null
          id?: string
          regra_recorrencia: string
          titulo_modelo: string
        }
        Update: {
          ativa?: boolean
          gera_blocos_ate?: string | null
          id?: string
          regra_recorrencia?: string
          titulo_modelo?: string
        }
        Relationships: []
      }
      flashcard: {
        Row: {
          ativo: boolean
          fator_facilidade: number
          frente: string
          id: string
          intervalo_atual_dias: number
          origem: Database["public"]["Enums"]["origem_conteudo"]
          proxima_revisao: string
          topico_id: string
          verso: string
        }
        Insert: {
          ativo?: boolean
          fator_facilidade?: number
          frente: string
          id?: string
          intervalo_atual_dias?: number
          origem?: Database["public"]["Enums"]["origem_conteudo"]
          proxima_revisao?: string
          topico_id: string
          verso: string
        }
        Update: {
          ativo?: boolean
          fator_facilidade?: number
          frente?: string
          id?: string
          intervalo_atual_dias?: number
          origem?: Database["public"]["Enums"]["origem_conteudo"]
          proxima_revisao?: string
          topico_id?: string
          verso?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_topico_id_fkey"
            columns: ["topico_id"]
            isOneToOne: false
            referencedRelation: "topico_edital"
            referencedColumns: ["id"]
          },
        ]
      }
      habito: {
        Row: {
          ativo: boolean
          categoria: string | null
          data_criacao: string
          dias_da_semana: number[] | null
          frequencia: string
          horario_fixo: string | null
          id: string
          meta_vida_ref: string | null
          nome: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          data_criacao?: string
          dias_da_semana?: number[] | null
          frequencia: string
          horario_fixo?: string | null
          id?: string
          meta_vida_ref?: string | null
          nome: string
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          data_criacao?: string
          dias_da_semana?: number[] | null
          frequencia?: string
          horario_fixo?: string | null
          id?: string
          meta_vida_ref?: string | null
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "habito_meta_vida_ref_fkey"
            columns: ["meta_vida_ref"]
            isOneToOne: false
            referencedRelation: "meta"
            referencedColumns: ["id"]
          },
        ]
      }
      idempotencia_acao: {
        Row: {
          chave: string
          entidade: string
          operacao: string
          processado_em: string
        }
        Insert: {
          chave: string
          entidade: string
          operacao: string
          processado_em?: string
        }
        Update: {
          chave?: string
          entidade?: string
          operacao?: string
          processado_em?: string
        }
        Relationships: []
      }
      inconsistencia_sinalizada: {
        Row: {
          descricao: string
          id: string
          processo_id: string
          status: string
          tipo: string
        }
        Insert: {
          descricao: string
          id?: string
          processo_id: string
          status?: string
          tipo: string
        }
        Update: {
          descricao?: string
          id?: string
          processo_id?: string
          status?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "inconsistencia_sinalizada_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processo"
            referencedColumns: ["id"]
          },
        ]
      }
      interacao_ia_estudos: {
        Row: {
          avaliacao_usuario: string | null
          data: string
          gerou_flashcard_id: string | null
          id: string
          prompt_enviado: string
          resposta_recebida: string
          tipo: string
          topico_id: string | null
        }
        Insert: {
          avaliacao_usuario?: string | null
          data?: string
          gerou_flashcard_id?: string | null
          id?: string
          prompt_enviado: string
          resposta_recebida: string
          tipo: string
          topico_id?: string | null
        }
        Update: {
          avaliacao_usuario?: string | null
          data?: string
          gerou_flashcard_id?: string | null
          id?: string
          prompt_enviado?: string
          resposta_recebida?: string
          tipo?: string
          topico_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interacao_ia_estudos_gerou_flashcard_id_fkey"
            columns: ["gerou_flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interacao_ia_estudos_topico_id_fkey"
            columns: ["topico_id"]
            isOneToOne: false
            referencedRelation: "topico_edital"
            referencedColumns: ["id"]
          },
        ]
      }
      interacao_ia_juridica: {
        Row: {
          data: string
          id: string
          processo_id: string | null
          prompt_enviado: string
          resposta_recebida: string
          revisao_humana_confirmada: boolean
          tipo_assistencia: string
        }
        Insert: {
          data?: string
          id?: string
          processo_id?: string | null
          prompt_enviado: string
          resposta_recebida: string
          revisao_humana_confirmada?: boolean
          tipo_assistencia: string
        }
        Update: {
          data?: string
          id?: string
          processo_id?: string | null
          prompt_enviado?: string
          resposta_recebida?: string
          revisao_humana_confirmada?: boolean
          tipo_assistencia?: string
        }
        Relationships: [
          {
            foreignKeyName: "interacao_ia_juridica_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processo"
            referencedColumns: ["id"]
          },
        ]
      }
      jurisprudencia_verificada: {
        Row: {
          data_verificacao: string
          ementa_resumida: string
          id: string
          link_conferencia: string
          numero_julgado: string
          origem: string
          status: string
          tema_tag: string
          tribunal: string
        }
        Insert: {
          data_verificacao: string
          ementa_resumida: string
          id?: string
          link_conferencia: string
          numero_julgado: string
          origem?: string
          status?: string
          tema_tag: string
          tribunal: string
        }
        Update: {
          data_verificacao?: string
          ementa_resumida?: string
          id?: string
          link_conferencia?: string
          numero_julgado?: string
          origem?: string
          status?: string
          tema_tag?: string
          tribunal?: string
        }
        Relationships: []
      }
      lancamento_financeiro: {
        Row: {
          categoria_id: string
          data: string
          descricao: string | null
          id: string
          origem_modulo: Database["public"]["Enums"]["modulo_sistema"] | null
          recorrente: boolean
          tipo: string
          valor: number
        }
        Insert: {
          categoria_id: string
          data?: string
          descricao?: string | null
          id?: string
          origem_modulo?: Database["public"]["Enums"]["modulo_sistema"] | null
          recorrente?: boolean
          tipo: string
          valor: number
        }
        Update: {
          categoria_id?: string
          data?: string
          descricao?: string | null
          id?: string
          origem_modulo?: Database["public"]["Enums"]["modulo_sistema"] | null
          recorrente?: boolean
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamento_financeiro_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categoria_financeira"
            referencedColumns: ["id"]
          },
        ]
      }
      medicamento: {
        Row: {
          ativo: boolean
          data_fim: string | null
          data_inicio: string
          dose: string
          frequencia_horario: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          data_fim?: string | null
          data_inicio: string
          dose: string
          frequencia_horario: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          data_fim?: string | null
          data_inicio?: string
          dose?: string
          frequencia_horario?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      meta: {
        Row: {
          confirmacao_manual: boolean
          data_alvo: string | null
          descricao: string | null
          horizonte: Database["public"]["Enums"]["horizonte_meta"]
          id: string
          nome: string
          status: Database["public"]["Enums"]["status_meta"]
          updated_at: string
        }
        Insert: {
          confirmacao_manual?: boolean
          data_alvo?: string | null
          descricao?: string | null
          horizonte: Database["public"]["Enums"]["horizonte_meta"]
          id?: string
          nome: string
          status?: Database["public"]["Enums"]["status_meta"]
          updated_at?: string
        }
        Update: {
          confirmacao_manual?: boolean
          data_alvo?: string | null
          descricao?: string | null
          horizonte?: Database["public"]["Enums"]["horizonte_meta"]
          id?: string
          nome?: string
          status?: Database["public"]["Enums"]["status_meta"]
          updated_at?: string
        }
        Relationships: []
      }
      meta_financeira: {
        Row: {
          confirmacao_manual: boolean
          id: string
          meta_vida_ref: string | null
          nome: string
          prazo: string | null
          status: string
          tipo: string
          updated_at: string
          valor_alvo: number | null
        }
        Insert: {
          confirmacao_manual?: boolean
          id?: string
          meta_vida_ref?: string | null
          nome: string
          prazo?: string | null
          status?: string
          tipo: string
          updated_at?: string
          valor_alvo?: number | null
        }
        Update: {
          confirmacao_manual?: boolean
          id?: string
          meta_vida_ref?: string | null
          nome?: string
          prazo?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          valor_alvo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meta_financeira_meta_vida_ref_fkey"
            columns: ["meta_vida_ref"]
            isOneToOne: false
            referencedRelation: "meta"
            referencedColumns: ["id"]
          },
        ]
      }
      modelo_minuta: {
        Row: {
          classe_aplicavel: string | null
          estrutura_secoes: string[]
          id: string
          nome: string
          tipo_peca: string
        }
        Insert: {
          classe_aplicavel?: string | null
          estrutura_secoes: string[]
          id?: string
          nome: string
          tipo_peca: string
        }
        Update: {
          classe_aplicavel?: string | null
          estrutura_secoes?: string[]
          id?: string
          nome?: string
          tipo_peca?: string
        }
        Relationships: []
      }
      padrao_formatacao: {
        Row: {
          campo: string
          id: string
          valor: string
        }
        Insert: {
          campo: string
          id?: string
          valor: string
        }
        Update: {
          campo?: string
          id?: string
          valor?: string
        }
        Relationships: []
      }
      parte: {
        Row: {
          contato: string | null
          documento: string | null
          id: string
          nome: string
          tipo: string
        }
        Insert: {
          contato?: string | null
          documento?: string | null
          id?: string
          nome: string
          tipo: string
        }
        Update: {
          contato?: string | null
          documento?: string | null
          id?: string
          nome?: string
          tipo?: string
        }
        Relationships: []
      }
      permissao_ia: {
        Row: {
          id: string
          modulo: Database["public"]["Enums"]["modulo_sistema"]
          nivel_acesso: Database["public"]["Enums"]["nivel_acesso_ia"]
          updated_at: string
        }
        Insert: {
          id?: string
          modulo: Database["public"]["Enums"]["modulo_sistema"]
          nivel_acesso?: Database["public"]["Enums"]["nivel_acesso_ia"]
          updated_at?: string
        }
        Update: {
          id?: string
          modulo?: Database["public"]["Enums"]["modulo_sistema"]
          nivel_acesso?: Database["public"]["Enums"]["nivel_acesso_ia"]
          updated_at?: string
        }
        Relationships: []
      }
      pilar_ativo: {
        Row: {
          ativo: boolean
          data_ativacao: string
          id: string
          modulo: Database["public"]["Enums"]["modulo_sistema"]
        }
        Insert: {
          ativo?: boolean
          data_ativacao?: string
          id?: string
          modulo: Database["public"]["Enums"]["modulo_sistema"]
        }
        Update: {
          ativo?: boolean
          data_ativacao?: string
          id?: string
          modulo?: Database["public"]["Enums"]["modulo_sistema"]
        }
        Relationships: []
      }
      prazo: {
        Row: {
          confirmacao_protocolo: boolean
          data_confirmacao: string | null
          data_limite: string
          descricao: string
          id: string
          processo_id: string
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          confirmacao_protocolo?: boolean
          data_confirmacao?: string | null
          data_limite: string
          descricao: string
          id?: string
          processo_id: string
          status?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          confirmacao_protocolo?: boolean
          data_confirmacao?: string | null
          data_limite?: string
          descricao?: string
          id?: string
          processo_id?: string
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prazo_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processo"
            referencedColumns: ["id"]
          },
        ]
      }
      preferencia_exibicao: {
        Row: {
          densidade_informacao: string
          id: string
          tema: string
        }
        Insert: {
          densidade_informacao?: string
          id?: string
          tema?: string
        }
        Update: {
          densidade_informacao?: string
          id?: string
          tema?: string
        }
        Relationships: []
      }
      processo: {
        Row: {
          camara_relator: string | null
          classe: string
          id: string
          numero: string
          orgao: string
          origem_comarca: string | null
          status: string
          tese_central: string | null
          updated_at: string
        }
        Insert: {
          camara_relator?: string | null
          classe: string
          id?: string
          numero: string
          orgao: string
          origem_comarca?: string | null
          status?: string
          tese_central?: string | null
          updated_at?: string
        }
        Update: {
          camara_relator?: string | null
          classe?: string
          id?: string
          numero?: string
          orgao?: string
          origem_comarca?: string | null
          status?: string
          tese_central?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      processo_parte: {
        Row: {
          papel_no_processo: string
          parte_id: string
          processo_id: string
        }
        Insert: {
          papel_no_processo: string
          parte_id: string
          processo_id: string
        }
        Update: {
          papel_no_processo?: string
          parte_id?: string
          processo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "processo_parte_parte_id_fkey"
            columns: ["parte_id"]
            isOneToOne: false
            referencedRelation: "parte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processo_parte_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processo"
            referencedColumns: ["id"]
          },
        ]
      }
      questao: {
        Row: {
          ano: number | null
          banca: string | null
          enunciado: string
          gabarito: string
          id: string
          origem_pdf_id: string | null
          topico_id: string
        }
        Insert: {
          ano?: number | null
          banca?: string | null
          enunciado: string
          gabarito: string
          id?: string
          origem_pdf_id?: string | null
          topico_id: string
        }
        Update: {
          ano?: number | null
          banca?: string | null
          enunciado?: string
          gabarito?: string
          id?: string
          origem_pdf_id?: string | null
          topico_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questao_origem_pdf_id_fkey"
            columns: ["origem_pdf_id"]
            isOneToOne: false
            referencedRelation: "documento_pdf"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questao_topico_id_fkey"
            columns: ["topico_id"]
            isOneToOne: false
            referencedRelation: "topico_edital"
            referencedColumns: ["id"]
          },
        ]
      }
      registro_agua: {
        Row: {
          data: string
          hora_registro: string | null
          id: string
          quantidade_ml: number
        }
        Insert: {
          data?: string
          hora_registro?: string | null
          id?: string
          quantidade_ml: number
        }
        Update: {
          data?: string
          hora_registro?: string | null
          id?: string
          quantidade_ml?: number
        }
        Relationships: []
      }
      registro_corporal: {
        Row: {
          data: string
          id: string
          observacao: string | null
          peso_kg: number
        }
        Insert: {
          data?: string
          id?: string
          observacao?: string | null
          peso_kg: number
        }
        Update: {
          data?: string
          id?: string
          observacao?: string | null
          peso_kg?: number
        }
        Relationships: []
      }
      registro_exercicio: {
        Row: {
          data: string
          duracao_min: number
          id: string
          intensidade_percebida: string | null
          tipo: string
        }
        Insert: {
          data?: string
          duracao_min: number
          id?: string
          intensidade_percebida?: string | null
          tipo: string
        }
        Update: {
          data?: string
          duracao_min?: number
          id?: string
          intensidade_percebida?: string | null
          tipo?: string
        }
        Relationships: []
      }
      registro_habito: {
        Row: {
          concluido: boolean
          data: string
          habito_id: string
          hora_registro: string | null
          id: string
          observacao: string | null
        }
        Insert: {
          concluido?: boolean
          data: string
          habito_id: string
          hora_registro?: string | null
          id?: string
          observacao?: string | null
        }
        Update: {
          concluido?: boolean
          data?: string
          habito_id?: string
          hora_registro?: string | null
          id?: string
          observacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registro_habito_habito_id_fkey"
            columns: ["habito_id"]
            isOneToOne: false
            referencedRelation: "habito"
            referencedColumns: ["id"]
          },
        ]
      }
      registro_humor: {
        Row: {
          data_hora: string
          energia: number | null
          humor: number
          id: string
          nota: string | null
        }
        Insert: {
          data_hora?: string
          energia?: number | null
          humor: number
          id?: string
          nota?: string | null
        }
        Update: {
          data_hora?: string
          energia?: number | null
          humor?: number
          id?: string
          nota?: string | null
        }
        Relationships: []
      }
      registro_medicamento: {
        Row: {
          data_hora: string
          id: string
          medicamento_id: string
          tomado: boolean
        }
        Insert: {
          data_hora?: string
          id?: string
          medicamento_id: string
          tomado?: boolean
        }
        Update: {
          data_hora?: string
          id?: string
          medicamento_id?: string
          tomado?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "registro_medicamento_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "medicamento"
            referencedColumns: ["id"]
          },
        ]
      }
      registro_sono: {
        Row: {
          data_referencia: string
          hora_acordar: string
          hora_dormir: string
          id: string
          qualidade_percebida: string | null
        }
        Insert: {
          data_referencia: string
          hora_acordar: string
          hora_dormir: string
          id?: string
          qualidade_percebida?: string | null
        }
        Update: {
          data_referencia?: string
          hora_acordar?: string
          hora_dormir?: string
          id?: string
          qualidade_percebida?: string | null
        }
        Relationships: []
      }
      resposta_questao: {
        Row: {
          acertou: boolean
          data: string
          id: string
          motivo_erro: Database["public"]["Enums"]["motivo_erro_questao"] | null
          questao_id: string
          tempo_gasto_seg: number | null
        }
        Insert: {
          acertou: boolean
          data?: string
          id?: string
          motivo_erro?:
            | Database["public"]["Enums"]["motivo_erro_questao"]
            | null
          questao_id: string
          tempo_gasto_seg?: number | null
        }
        Update: {
          acertou?: boolean
          data?: string
          id?: string
          motivo_erro?:
            | Database["public"]["Enums"]["motivo_erro_questao"]
            | null
          questao_id?: string
          tempo_gasto_seg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "resposta_questao_questao_id_fkey"
            columns: ["questao_id"]
            isOneToOne: false
            referencedRelation: "questao"
            referencedColumns: ["id"]
          },
        ]
      }
      revisao_flashcard: {
        Row: {
          data: string
          flashcard_id: string
          id: string
          novo_intervalo_dias: number
          qualidade_resposta: number
        }
        Insert: {
          data?: string
          flashcard_id: string
          id?: string
          novo_intervalo_dias: number
          qualidade_resposta: number
        }
        Update: {
          data?: string
          flashcard_id?: string
          id?: string
          novo_intervalo_dias?: number
          qualidade_resposta?: number
        }
        Relationships: [
          {
            foreignKeyName: "revisao_flashcard_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcard"
            referencedColumns: ["id"]
          },
        ]
      }
      sessao_estudo: {
        Row: {
          bloco_id: string | null
          categoria: Database["public"]["Enums"]["categoria_estudo"]
          fim: string
          id: string
          inicio: string
          observacoes: string | null
          topico_id: string
        }
        Insert: {
          bloco_id?: string | null
          categoria: Database["public"]["Enums"]["categoria_estudo"]
          fim: string
          id?: string
          inicio: string
          observacoes?: string | null
          topico_id: string
        }
        Update: {
          bloco_id?: string | null
          categoria?: Database["public"]["Enums"]["categoria_estudo"]
          fim?: string
          id?: string
          inicio?: string
          observacoes?: string | null
          topico_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessao_estudo_bloco_id_fkey"
            columns: ["bloco_id"]
            isOneToOne: false
            referencedRelation: "bloco_cronograma"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessao_estudo_topico_id_fkey"
            columns: ["topico_id"]
            isOneToOne: false
            referencedRelation: "topico_edital"
            referencedColumns: ["id"]
          },
        ]
      }
      simulacao_cenario: {
        Row: {
          data_criacao: string
          hipotetico: boolean
          id: string
          nome: string
          parametro_aumento_despesa: number | null
          parametro_periodo_meses: number
          parametro_reducao_renda: number | null
          resultado_runway_hipotetico: number
        }
        Insert: {
          data_criacao?: string
          hipotetico?: boolean
          id?: string
          nome: string
          parametro_aumento_despesa?: number | null
          parametro_periodo_meses: number
          parametro_reducao_renda?: number | null
          resultado_runway_hipotetico: number
        }
        Update: {
          data_criacao?: string
          hipotetico?: boolean
          id?: string
          nome?: string
          parametro_aumento_despesa?: number | null
          parametro_periodo_meses?: number
          parametro_reducao_renda?: number | null
          resultado_runway_hipotetico?: number
        }
        Relationships: []
      }
      sinal_progresso: {
        Row: {
          data: string
          descricao: string
          id: string
          indicador_valor: number | null
          meta_id: string
          modulo_origem: Database["public"]["Enums"]["modulo_sistema"]
        }
        Insert: {
          data?: string
          descricao: string
          id?: string
          indicador_valor?: number | null
          meta_id: string
          modulo_origem: Database["public"]["Enums"]["modulo_sistema"]
        }
        Update: {
          data?: string
          descricao?: string
          id?: string
          indicador_valor?: number | null
          meta_id?: string
          modulo_origem?: Database["public"]["Enums"]["modulo_sistema"]
        }
        Relationships: [
          {
            foreignKeyName: "sinal_progresso_meta_id_fkey"
            columns: ["meta_id"]
            isOneToOne: false
            referencedRelation: "meta"
            referencedColumns: ["id"]
          },
        ]
      }
      topico_edital: {
        Row: {
          contador_revisoes: number
          data_ultima_revisao: string | null
          disciplina_id: string
          id: string
          incidencia: string | null
          ordem_na_lista: number
          proxima_revisao_sugerida: string | null
          status: Database["public"]["Enums"]["status_topico"]
          texto_original_edital: string | null
          tipo_conteudo: Database["public"]["Enums"]["tipo_conteudo_topico"]
          titulo: string
          topico_pai_id: string | null
          updated_at: string
        }
        Insert: {
          contador_revisoes?: number
          data_ultima_revisao?: string | null
          disciplina_id: string
          id?: string
          incidencia?: string | null
          ordem_na_lista?: number
          proxima_revisao_sugerida?: string | null
          status?: Database["public"]["Enums"]["status_topico"]
          texto_original_edital?: string | null
          tipo_conteudo: Database["public"]["Enums"]["tipo_conteudo_topico"]
          titulo: string
          topico_pai_id?: string | null
          updated_at?: string
        }
        Update: {
          contador_revisoes?: number
          data_ultima_revisao?: string | null
          disciplina_id?: string
          id?: string
          incidencia?: string | null
          ordem_na_lista?: number
          proxima_revisao_sugerida?: string | null
          status?: Database["public"]["Enums"]["status_topico"]
          texto_original_edital?: string | null
          tipo_conteudo?: Database["public"]["Enums"]["tipo_conteudo_topico"]
          titulo?: string
          topico_pai_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "topico_edital_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplina"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topico_edital_topico_pai_id_fkey"
            columns: ["topico_pai_id"]
            isOneToOne: false
            referencedRelation: "topico_edital"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      runway_atual: {
        Row: {
          media_despesas_3_meses: number | null
          saldo_atual: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      abrir_conflito_sincronizacao: {
        Args: {
          p_entidade: string
          p_entidade_id: string
          p_origem_a: string
          p_origem_b: string
          p_versao_dispositivo_a: Json
          p_versao_dispositivo_b: Json
        }
        Returns: string
      }
      marcar_conflito_resolvido: {
        Args: { p_conflito_id: string; p_versao_final: Json }
        Returns: undefined
      }
      registrar_acao_idempotente: {
        Args: { p_chave: string; p_entidade: string; p_operacao: string }
        Returns: boolean
      }
    }
    Enums: {
      categoria_estudo:
        | "lei_seca"
        | "jurisprudencia"
        | "questoes"
        | "revisao"
        | "redacao"
        | "doutrina"
      horizonte_meta: "curto_prazo" | "medio_prazo" | "longo_prazo"
      modulo_sistema:
        | "estudos"
        | "trabalho"
        | "financas"
        | "saude"
        | "rotinas"
        | "objetivos"
        | "relacionamentos"
        | "diario"
        | "biblioteca"
        | "arquivos"
        | "projetos"
      motivo_erro_questao:
        | "desconhecimento"
        | "pegadinha"
        | "interpretacao"
        | "distracao"
      nivel_acesso_ia:
        | "acesso_total"
        | "acesso_mediante_confirmacao"
        | "sem_acesso"
      origem_conteudo: "manual" | "gerado_por_ia"
      status_bloco:
        | "planejado"
        | "em_andamento"
        | "concluido"
        | "perdido"
        | "cancelado"
      status_meta: "em_andamento" | "atingida" | "abandonada"
      status_topico: "nao_iniciado" | "em_estudo" | "revisado" | "consolidado"
      tipo_conteudo_topico: "lei_seca" | "doutrina"
      tipo_origem_bloco:
        | "trabalho"
        | "estudos"
        | "habito"
        | "saude"
        | "pessoal"
        | "manual"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      categoria_estudo: [
        "lei_seca",
        "jurisprudencia",
        "questoes",
        "revisao",
        "redacao",
        "doutrina",
      ],
      horizonte_meta: ["curto_prazo", "medio_prazo", "longo_prazo"],
      modulo_sistema: [
        "estudos",
        "trabalho",
        "financas",
        "saude",
        "rotinas",
        "objetivos",
        "relacionamentos",
        "diario",
        "biblioteca",
        "arquivos",
        "projetos",
      ],
      motivo_erro_questao: [
        "desconhecimento",
        "pegadinha",
        "interpretacao",
        "distracao",
      ],
      nivel_acesso_ia: [
        "acesso_total",
        "acesso_mediante_confirmacao",
        "sem_acesso",
      ],
      origem_conteudo: ["manual", "gerado_por_ia"],
      status_bloco: [
        "planejado",
        "em_andamento",
        "concluido",
        "perdido",
        "cancelado",
      ],
      status_meta: ["em_andamento", "atingida", "abandonada"],
      status_topico: ["nao_iniciado", "em_estudo", "revisado", "consolidado"],
      tipo_conteudo_topico: ["lei_seca", "doutrina"],
      tipo_origem_bloco: [
        "trabalho",
        "estudos",
        "habito",
        "saude",
        "pessoal",
        "manual",
      ],
    },
  },
} as const
