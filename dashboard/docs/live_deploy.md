  ### 🛠️ Como Executar a Sincronização                                                                                                             
                                                                                                                                                  
  Siga este passo a passo para fazer o deploy de forma segura:                                                                                    
                                                                                                                                                  
  #### 1. Descobrir a Pasta Remota Exata do PM2                                                                                                   
                                                                                                                                                  
  Para ter 100% de certeza do diretório correto no servidor e não interferir com o WordOps, rode o seguinte comando no seu terminal local:        
                                                                                                                                                  
    ssh root@62.238.22.162 "export PATH=\"/root/.nvm/versions/node/v20.20.2/bin:\$PATH\" && pm2 show 55"                                          
                                                                                                                                                  
  Procure pela linha que diz  cwd  ou  directory  no retorno.                                                                                     
                                                                                                                                                  
  #### 2. Ajustar o Caminho no Script                                                                                                             
                                                                                                                                                  
  Abra o arquivo deploy_live.sh e altere a variável  TARGET_DIR  na linha 20 com o caminho que você encontrou no passo anterior (coloquei o padrão
  /var/www/cocreator-n8n/dashboard  como placeholder).                                                                                            
  
  #### 3. Dar Permissão de Execução ao Script
  
  No terminal local da sua máquina, execute:
  
    chmod +x scripts/deploy_live.sh
  
  #### 4. Executar o Deploy
  
  Agora basta rodar o script: