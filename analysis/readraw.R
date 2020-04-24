#!/usr/bin/env Rscript

# 20200410WF - init
#  parse poorly quoted json string into it's own columns
# reads from stdin and outputs to stdout. used by datastring2tsv inside Makefile
# add additional columns derived from raw data

options(warn=-1)
suppressMessages({library(dplyr); library(tidyr)})

# 8=>.8, 2=>.2, 1 stays 1
label2prob <- function(x) { x<-as.numeric(x); ifelse(x == 1, 1, x/10) }


#d <- read.table("txt/res-raw.tsv",sep="\t", stringsAsFactors=F, header=T)
d <- read.table(file("stdin"), header=T, sep="\t", stringsAsFactors=F)

# make standard json: {name:xxx,age:yy} => {"name":"xxx", "age":"yy"}
# json into R object
# add "subjInfo" column back so we can merge
# -- any new items added to the first question slide will be added here
#    without having to manually add them
unjsoned <-
   lapply(d$subjInfo, function(x) 
   gsub("([^{}:,]+)", '"\\1"', x) %>% # add quotes to json
   gsub(x=., '":,"', '":"","') %>%        # no value? make empty string default
   jsonlite::parse_json() %>% 
   as.data.frame %>% mutate(subjInfo=x)
 ) %>%
 unique %>%
 bind_rows %>% 
 merge(d, by="subjInfo", all=T)


# 20200410FC  (WF tidyverse-ize)
#  and age parsed out from subjInfo by parse_json
# 20200424WF
#  update for ISH, still allow DFR
data <- unjsoned %>%
    # turn p28_8D into p28, .8, D
    # N.B. block created twice, second overrides. both should be identical
    extract(picked ,c("block","choiceP", "choiceCard"), "(p[128]+)_([128])([A-Z])") %>%
    extract(ignored ,c("block","ignP", "ignCard"), "(p[128]+)_([128])([A-Z])") %>%
    mutate(ses_id = paste(subjID, age, name, sep="_"),
           abstrial = trial,
           choiceP = label2prob(choiceP),
           ignP = label2prob(ignP),
           # high, old red (H or R) is 2, others ( I, S; or old blue D,F) is 1
           choiceType = ifelse(grepl('[HR]',paste0(choiceCard,choiceCard)), 2, 1),
           choseHigh = as.numeric(grepl('[HR]',choiceCard)),
           choseFirst= as.numeric(grepl('[ID]',choiceCard))
           ) %>%
    filter(block != "") %>% # remove feedback trials
    # count trials per subject. should match abstrial/2 
    # count phase changes (block number) within subjects
    group_by(ses_id) %>%
    mutate(trial=1:n(),
           blocknum = (block!=lag(block)) %>% ifelse(is.na(.),1,.) %>% cumsum) %>%
    ungroup
           
write.table(data, sep="\t", file="", row.names=F, quote=F)

# show
# data %>% split(.$name)%>% purrr::map(tail,n=2) %>% bind_rows %>% select(name,taskver,block,choiceCard,choiceP,choiceType) %>% print(n=1000)
