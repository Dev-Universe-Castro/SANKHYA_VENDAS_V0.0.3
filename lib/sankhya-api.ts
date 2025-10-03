
import axios from 'axios';

// Configuração da API
const ENDPOINT_LOGIN = "https://api.sandbox.sankhya.com.br/login";
const URL_CONSULTA_SERVICO = "https://api.sandbox.sankhya.com.br/gateway/v1/mge/service.sbr?serviceName=CRUDServiceProvider.loadRecords&outputType=json";
const URL_SAVE_SERVICO = "https://api.sandbox.sankhya.com.br/gateway/v1/mge/service.sbr?serviceName=CRUDServiceProvider.saveRecord&outputType=json";

const LOGIN_HEADERS = {
  'token': "c3744c65-acd9-4d36-aa35-49ecb13aa774",
  'appkey': "79bf09c7-7aa9-4ac6-b8a4-0c3aa7acfcae",
  'username': "renan.silva@sankhya.com.br",
  'password': "Integracao123!"
};

let cachedToken: string | null = null;

// Obter Token
async function obterToken(): Promise<string> {
  if (cachedToken) {
    return cachedToken;
  }

  try {
    const resposta = await axios.post(ENDPOINT_LOGIN, {}, {
      headers: LOGIN_HEADERS
    });

    const token = resposta.data.bearerToken || resposta.data.token;

    if (!token) {
      console.error("Token não encontrado na resposta:", resposta.data);
      throw new Error("Resposta de login do Sankhya não continha o token esperado.");
    }

    cachedToken = token;
    return token;

  } catch (erro: any) {
    console.error("Erro no Login Sankhya:", erro.response ? erro.response.data : erro.message);
    throw new Error("Falha na autenticação Sankhya. Verifique os Headers de Login.");
  }
}

// Requisição Autenticada Genérica
async function fazerRequisicaoAutenticada(fullUrl: string, method = 'POST', data = {}) {
  const token = await obterToken();

  try {
    const config = {
      method: method.toLowerCase(),
      url: fullUrl,
      data: data,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const resposta = await axios(config);
    return resposta.data;

  } catch (erro: any) {
    const apiErrorDetails = erro.response ? JSON.stringify(erro.response.data) : erro.message;
    console.error(`Falha na requisição Sankhya. Método: ${method}, URL: ${fullUrl}. Detalhes da API:`, apiErrorDetails);

    if (erro.response && erro.response.status === 401) {
      cachedToken = null;
      throw new Error("Sessão expirada. Tente novamente.");
    }

    throw new Error("Falha na comunicação com a API Sankhya.");
  }
}

// Mapeamento de Parceiros
function mapearParceiros(entities: any) {
  const fieldNames = entities.metadata.fields.field.map((f: any) => f.name);
  
  return entities.entity.map((rawEntity: any, index: number) => {
    const cleanObject: any = {};
    
    for (let i = 0; i < fieldNames.length; i++) {
      const fieldKey = `f${i}`;
      const fieldName = fieldNames[i];
      
      if (rawEntity[fieldKey]) {
        cleanObject[fieldName] = rawEntity[fieldKey].$;
      }
    }
    
    cleanObject._id = cleanObject.CODPARC ? String(cleanObject.CODPARC) : String(index);
    return cleanObject;
  });
}

// Consultar Parceiros com Paginação
export async function consultarParceiros(page: number = 1, pageSize: number = 50, searchTerm: string = '') {
  // Calcular o offset baseado na página
  const offset = (page - 1) * pageSize;
  
  // Construir critério de busca
  let criteriaExpression = "CLIENTE = 'S'";
  
  if (searchTerm.trim() !== '') {
    criteriaExpression += ` AND (NOMEPARC LIKE '%${searchTerm}%' OR CGC_CPF LIKE '%${searchTerm}%' OR CODPARC LIKE '%${searchTerm}%')`;
  }
  
  const PARCEIROS_PAYLOAD = {
    "requestBody": {
      "dataSet": {
        "rootEntity": "Parceiro",
        "includePresentationFields": "N",
        "offsetPage": String(offset),
        "limit": String(pageSize),
        "criteria": {
          "expression": {
            "$": criteriaExpression
          }
        },
        "entity": {
          "fieldset": {
            "list": "CODPARC, NOMEPARC, CGC_CPF, CODCID, ATIVO, TIPPESSOA"
          }
        }
      }
    }
  };

  try {
    const respostaCompleta = await fazerRequisicaoAutenticada(
      URL_CONSULTA_SERVICO,
      'POST',
      PARCEIROS_PAYLOAD
    );

    const entities = respostaCompleta.responseBody.entities;
    
    if (!entities || !Array.isArray(entities.entity)) {
      console.error("Estrutura de dados 'entities' inesperada:", entities);
      throw new Error("A resposta não contém a lista de parceiros no formato esperado.");
    }
    
    const listaParceirosLimpa = mapearParceiros(entities);
    
    // Retornar dados paginados com informações adicionais
    return {
      parceiros: listaParceirosLimpa,
      total: entities.total ? parseInt(entities.total) : listaParceirosLimpa.length,
      page,
      pageSize,
      totalPages: entities.total ? Math.ceil(parseInt(entities.total) / pageSize) : 1
    };

  } catch (erro) {
    throw erro;
  }
}

// Criar/Atualizar Parceiro
export async function salvarParceiro(parceiro: { 
  CODPARC?: string; 
  NOMEPARC: string; 
  CGC_CPF: string; 
  CODCID: string; 
  ATIVO: string; 
  TIPPESSOA: string 
}) {
  // Se tem CODPARC, é atualização (usa DatasetSP.save com pk)
  if (parceiro.CODPARC) {
    const URL_UPDATE_SERVICO = "https://api.sandbox.sankhya.com.br/gateway/v1/mge/service.sbr?serviceName=DatasetSP.save&outputType=json";
    
    const UPDATE_PAYLOAD = {
      "serviceName": "DatasetSP.save",
      "requestBody": {
        "entityName": "Parceiro",
        "standAlone": false,
        "fields": [
          "CODPARC",
          "NOMEPARC",
          "ATIVO",
          "TIPPESSOA",
          "CGC_CPF",
          "CODCID"
        ],
        "records": [
          {
            "pk": {
              "CODPARC": String(parceiro.CODPARC)
            },
            "values": {
              "1": parceiro.NOMEPARC,
              "2": parceiro.ATIVO,
              "3": parceiro.TIPPESSOA,
              "4": parceiro.CGC_CPF,
              "5": parceiro.CODCID
            }
          }
        ]
      }
    };

    try {
      console.log("📤 Enviando requisição para atualizar parceiro:", {
        codigo: parceiro.CODPARC,
        nome: parceiro.NOMEPARC,
        cpfCnpj: parceiro.CGC_CPF,
        cidade: parceiro.CODCID,
        ativo: parceiro.ATIVO,
        tipo: parceiro.TIPPESSOA
      });

      const resposta = await fazerRequisicaoAutenticada(
        URL_UPDATE_SERVICO,
        'POST',
        UPDATE_PAYLOAD
      );

      console.log("✅ Parceiro atualizado com sucesso:", resposta);
      
      return resposta;
    } catch (erro: any) {
      console.error("❌ Erro ao atualizar Parceiro Sankhya:", {
        message: erro.message,
        codigo: parceiro.CODPARC,
        dados: {
          nome: parceiro.NOMEPARC,
          cpfCnpj: parceiro.CGC_CPF,
          cidade: parceiro.CODCID
        }
      });
      throw erro;
    }
  }

  // Se não tem CODPARC, é criação (usa DatasetSP.save)
  const URL_CREATE_SERVICO = "https://api.sandbox.sankhya.com.br/gateway/v1/mge/service.sbr?serviceName=DatasetSP.save&outputType=json";
  
  const CREATE_PAYLOAD = {
    "serviceName": "DatasetSP.save",
    "requestBody": {
      "entityName": "Parceiro",
      "standAlone": false,
      "fields": [
        "CODPARC",
        "NOMEPARC",
        "ATIVO",
        "TIPPESSOA",
        "CGC_CPF",
        "CODCID"
      ],
      "records": [
        {
          "values": {
            "1": parceiro.NOMEPARC,
            "2": parceiro.ATIVO,
            "3": parceiro.TIPPESSOA,
            "4": parceiro.CGC_CPF,
            "5": parceiro.CODCID
          }
        }
      ]
    }
  };

  try {
    console.log("📤 Enviando requisição para criar parceiro:", {
      nome: parceiro.NOMEPARC,
      cpfCnpj: parceiro.CGC_CPF,
      cidade: parceiro.CODCID,
      ativo: parceiro.ATIVO,
      tipo: parceiro.TIPPESSOA
    });

    const resposta = await fazerRequisicaoAutenticada(
      URL_CREATE_SERVICO,
      'POST',
      CREATE_PAYLOAD
    );

    console.log("✅ Parceiro criado com sucesso:", resposta);
    
    return resposta;
  } catch (erro: any) {
    console.error("❌ Erro ao criar Parceiro Sankhya:", {
      message: erro.message,
      dados: {
        nome: parceiro.NOMEPARC,
        cpfCnpj: parceiro.CGC_CPF,
        cidade: parceiro.CODCID
      }
    });
    throw erro;
  }
}
