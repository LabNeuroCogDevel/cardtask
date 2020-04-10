#!/usr/bin/env Rscript

# 20200410WF - init
#  parse poorly quoted json string into it's own columns

suppressMessages(library(dplyr))
#d <- read.table("txt/res.tsv",sep="\t", stringsAsFactors=F)
d <- read.table(file("stdin"), header=T, sep="\t", stringsAsFactors=F)
lapply(d$qs, function(x) 
   gsub("(\\w+)", '"\\1"', x) %>%
   jsonlite::parse_json() %>% 
   as.data.frame %>% mutate(qs=x)
 ) %>%
 bind_rows %>% 
 merge(d, by="qs", all=T) %>% 
 write.table(sep="\t", file="", row.names=F)
