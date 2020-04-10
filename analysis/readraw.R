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
   gsub("([^{}:,]+)", '"\\1"', x) %>%
   jsonlite::parse_json() %>% 
   as.data.frame %>% mutate(subjInfo=x)
 ) %>%
 unique %>%
 bind_rows %>% 
 merge(d, by="subjInfo", all=T)


# 20200410FC  (WF tidyverse-ize)
# name and age parsed out from subjInfo by parse_json
clean <- unjsoned %>%
    # turn p28_8D into p28, .8, D
    # N.B. block created twice, second overrides. both should be identical
    extract(leftInfo ,c("block","leftP", "leftCard"), "(p[128]+)_([128])([DFR])") %>%
    extract(rightInfo ,c("block","rightP", "rightCard"), "(p[128]+)_([128])([DFR])") %>%
    mutate(ses_id = paste(subjID, age, name, sep="_"),
           abstrial = trial,
           leftP = label2prob(leftP),
           rightP = label2prob(rightP),
           choiceCard = ifelse(key==37, leftCard, rightCard),
           # red is 2, blue (D or F) is 1
           choiceType = ifelse(leftCard=='R'|rightCard=='R', 2, 1),
           choseRed = as.numeric(choiceCard=='R')
           ) %>%
    filter(block != "") %>% # remove feedback trials
    # count trials per subject. should match abstrial/2 
    # count phase changes (block number) within subjects
    group_by(ses_id) %>%
    mutate(trial=1:n(),
           blocknum = (block!=lag(block)) %>% ifelse(is.na(.),1,.) %>% cumsum) %>%
    ungroup
           

# what was the first good card (always D)
# one row per subject with first good column
firstGood <-
    clean %>% group_by(ses_id) %>%
    filter(choiceType==1) %>% filter(trial==min(trial)) %>%
    mutate(firstGood=ifelse(leftP > rightP, leftCard, rightCard)) %>%
    select(ses_id, firstGood)

# goin back to by-trial dataframe
data <- inner_join(clean, firstGood) %>%
    mutate(choseFirst= as.numeric(choiceCard == firstGood))


write.table(data, sep="\t", file="", row.names=F, quote=F)
